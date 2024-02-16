import json
import re
from os import walk
from urllib.parse import urlparse, unquote

import markdown as markdown
import requests
from flask import Flask, redirect, render_template, request, session, abort  # , url_for, session
from flask_qrcode import QRcode
from square.client import Client as SquareClient
# noinspection PyPackageRequirements
from sass import compile
import corha
import os
import subprocess
import platform
import string
from datetime import datetime

# noinspection PyPackageRequirements
from sqlalchemy import and_
# noinspection PyPackageRequirements
from werkzeug.exceptions import HTTPException

from webapp.svgs import *
from webapp.models import *


def create_app():
	app = Flask(__name__, static_folder=None)
	with app.app_context():
		app.envs = corha.credentials_loader(".env")
		app.requests_session = requests.Session()
		app.requests_session.get("https://photoslibrary.googleapis.com/v1/mediaItems/")
		git = ["git", "/usr/bin/git"][platform.system() == "Linux"]
		output = subprocess.run([
						git, '-C', os.getcwd(),
						'rev-parse', '--short', 'HEAD'
					], capture_output=True)
		print(commit := output.stdout.decode('UTF-8').strip('\r\n'))
		output = subprocess.run([git, 'describe', '--tags'], capture_output=True)
		print(tag := output.stdout.decode('UTF-8').strip('\r\n'))

		app.config['commit'] = commit
		app.config['tag'] = tag
		app.config['SECRET_KEY'] = app.envs.secret_key
		app.config['FLASK_ENV'] = "development"
		app.config['SQLALCHEMY_DATABASE_URI'] = app.envs.postgresql
		app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
		app.config['MAX_CONTENT_LENGTH'] = 5 * 1000 * 1000

		from webapp.models import db, login_manager
		db.init_app(app)
		login_manager.init_app(app)
		# login_manager.login_view = 'routes.members'

		db.create_all()

		qrcode = QRcode()
		qrcode.init_app(app)

		# get available sounds
		app.sounds_path = "static/sounds/"
		for (_, _, app.available_sounds) in walk("webapp/" + app.sounds_path):
			# print(app.available_sounds)
			break

		if not hasattr(app, "available_sounds"):
			app.available_sounds = []

		app.config['g_client_id'] = app.envs.g_client_id
		app.config['g_client_secret'] = app.envs.g_client_secret

		app.square = SquareClient(
			access_token=app.envs.square_access_token,
			environment=app.envs.square_environment
		)

		compile(dirname=("webapp/static/scss/", "webapp/static/css/"), output_style="compressed")

		app.jinja_env.globals.update(
			md=markdown.markdown,
			str=str,
			len=len,
			type=type,
			list=list,
			datetime=datetime,
			json=json
		)

		@app.context_processor
		def inject_nav():
			icons = {
				"fb_icon": fb_icon,
				"tw_icon": tw_icon,
				"ig_icon": ig_icon,
				"other_icon": other_icon,
				"email_icon": email_icon,
				"blog_icon": blog_icon,
				"search": magnify,
				"eye": eye,
				"trash": trash,
				"x": cross,
				"drama": drama,
				"noda": noda,
				"note": note,
				"person": person,
				"admin": admin,
				"dashboard": dash,
				"help": help_icon,
				"logout": logout_icon,
				"copy_icon": copy_icon,
				"important": important,
				"ticket": ticket,
				"membership": membership
			}

			nav = [
				{"title": "Home", "link": "/", "is_active": False},
				# {"title": "Lorem", "link": "/lorem", "is_active": False},
				{"title": "Blog", "link": "/blog", "is_active": False},
				{"title": "Past Shows", "link": "/past-shows", "is_active": False},
				{"title": "Auditions", "link": "/auditions", "is_active": False},
				{"title": "About Us", "link": "/about-us", "is_active": False},
				{"title": "Members", "link": "/members", "is_active": False}
			]
			if request.url_rule is not None:
				route_split = ["/" + i for i in request.url_rule.rule[1:].split("/")]
				for i in range(0, len(nav)):
					nav[i].__setitem__("is_active", route_split[0] == nav[i]["link"])

			raw_socials = KeyValue.query.filter_by(key="socials").first().value.translate(
				str.maketrans('', '', string.whitespace)).replace("https://", "").replace("http://", "").split(",")

			socials = []

			for i in raw_socials:
				if "|" in i:
					a, b = i.split("|", 1)
					if "newsletter" in a.lower():
						icon = email_icon
					else:
						icon = other_icon
					socials.append({"type": "other", "link": b, "text": unquote(a), "icon": icon})
				elif "facebook" in i:
					socials.append({"type": "facebook", "link": i, "text": "Facebook", "icon": fb_icon})
				elif "twitter" in i:
					socials.append({"type": "twitter", "link": i, "text": "Twitter", "icon": tw_icon})
				elif "instagram" in i:
					socials.append({"type": "instagram", "link": i, "text": "Instagram", "icon": ig_icon})
				else:
					socials.append({"type": "other", "link": i, "text": urlparse(i).netloc, "icon": other_icon})

			web_config = {
				"site-name": KeyValue.query.filter_by(key="site-name").first().value,
				"site_logo": KeyValue.query.filter_by(key="site_logo").first(),
				"tickets-active": KeyValue.query.filter_by(key="tickets-active").first().value,
				"tickets-link": KeyValue.query.filter_by(key="tickets-link").first().value,
				"tickets-hero-photo": KeyValue.query.filter_by(key="tickets-hero-photo").first(),
				"user_feedback_link": KeyValue.query.filter_by(key="user_feedback_link").first().value
			}

			if (db_latest_blog := Post.query.filter_by(type="blog").filter(Post.date < datetime.now()).order_by(Post.date.desc()).first()) is not None:
				web_config["latest_blog"] = (db_latest_blog.date.strftime("%b %Y"), db_latest_blog.title,)

			if (db_latest_show := Show.query.filter(Show.date < datetime.now()).order_by(
					Show.date.desc()).first()) is not None:
				web_config["last_show"] = (db_latest_show.title, f"/past-shows/{db_latest_show.id}",)

			m_shows = Show.query \
				.order_by(Show.date.desc()) \
				.limit(4) \
				.all()

			session.permanent = True

			return dict(
				app=app,
				nav=nav,
				socials=socials,
				web_config=web_config,
				icons=icons,
				m_shows=m_shows
			)

		from webapp import routes, members_routes, photos_routes, analytics_routes, tickets_routes
		app.register_blueprint(routes.bp)
		app.register_blueprint(members_routes.bp)
		app.register_blueprint(photos_routes.bp)
		app.register_blueprint(analytics_routes.bp)
		app.register_blueprint(tickets_routes.bp)

		@login_manager.unauthorized_handler
		def unauthorized_handler():
			# print("401 test")
			abort(401)

		# @app.errorhandler(401)
		# def unauthorised_error(e):
		# 	return redirect(url_for("routes.members"))

		@app.errorhandler(HTTPException)
		def default_error(e):
			if int(str(e)[:3]) == 404:
				if (page := re.search(r"^/((new-year)|(spring)|(autumn))-\d{4}", request.path)) is not None:
					aim = page.group()[1:].rsplit("-", 1)
					show = Show.query \
						.filter_by(season=aim[0].replace("-", " ").title()) \
						.filter(
							and_(
								Show.date > datetime.fromisocalendar(int(aim[1]), 1, 1),
								Show.date < datetime.fromisocalendar(int(aim[1]) + 1, 1, 1)
							)
						).first()
					if show is not None:
						return redirect(f"/past-shows/{show.id}/{show.title.lower().replace(' ', '-')}")
			# print(int(str(e)[:3]))
			return render_template('error.html', error=e, css="frontpage.css"), int(str(e)[:3])

	return app


