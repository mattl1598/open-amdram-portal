import io
import re
from datetime import datetime
from pprint import pprint
from urllib.parse import urlparse
from lorem_text import lorem as lorem_func
import corha
import pyotp
import csv
# import json

from flask import abort, Blueprint, make_response, redirect, render_template, Response, send_file, send_from_directory, \
	url_for, \
	request, session
from flask_login import login_required, login_user, current_user  # , login_required, logout_user
from sqlalchemy import or_, and_
from werkzeug.exceptions import HTTPException

# from webapp import app, db

from webapp.members_routes import MemberPost
from webapp.models import BlogImage, BlogPost, Files, KeyValue, Member, Post, Show, ShowPhotos, User, \
	MemberShowLink as MSL, db
from webapp.svgs import *


from flask import current_app as app
bp = Blueprint("routes", __name__)


class NavItem:
	def __init__(self, tit, lin):
		self.title = tit
		self.link = lin


class MemberRenderer:
	has_user = False
	has_diff = False

	def __init__(self, member, user=None):
		try:
			self.role_type = member.cast_or_crew
		except AttributeError:
			self.role_type = ""

		try:
			self.role = member.role_name
		except AttributeError:
			self.role = ""

		if user is None:
			self.id = member.id
			self.firstname = member.firstname
			self.lastname = member.lastname
		else:
			self.id = user.id
			self.firstname = user.firstname
			self.lastname = user.lastname
			self.has_user = True

			if (member.firstname != user.firstname) or (member.lastname != user.lastname):
				self.as_firstname = member.firstname
				self.as_lastname = member.lastname
				self.has_diff = True

	def get_link(self):
		return "/".join(["/past-shows", ["m", "u"][self.has_user], self.id, "-".join([self.firstname, self.lastname])])


@bp.route("/", methods=["GET"])
def frontpage():
	latest_show = Show.query \
		.filter(Show.date < datetime.now()) \
		.order_by(Show.date.desc()) \
		.first()

	all_photos = ShowPhotos.query \
		.filter_by(show_id=latest_show.id) \
		.all()

	photos = []
	for i in all_photos:
		size = i.photo_desc.split(",")
		if size[0] > size[1]:
			photos.append(i)

		if len(photos) == (5 - int(KeyValue.query.filter_by(key="tickets-active").first().value)):
			break

	post = Post.query \
		.filter(or_(Post.type == "public", Post.type == "auditions")) \
		.join(Show, Post.show_id == Show.id) \
		.filter(Show.date > datetime.now()) \
		.order_by(Show.date.asc()) \
		.order_by(Post.date.desc()) \
		.with_entities(
		Post.date,
		Post.title,
		Post.content,
		Show.title.label("show_title"),
		Show.subtitle.label("show_subtitle")
	) \
		.first()

	if post is None:
		post = Show.query \
			.filter(Show.date > datetime.now()) \
			.order_by(Show.date.asc()) \
			.with_entities(
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle")
		) \
			.first()

	return render_template(
		"frontpage.html",
		latest_show=latest_show,
		post=post,
		photos=photos,
		frontpage=True,
		css="frontpage.css",
		js="carousel.js"
	)


@bp.get("/links")
def links():
	return render_template(
		"layout.html",
		css="links.css"
	)


@bp.route("/auditions", methods=["GET"])
def auditions():
	post = Post.query \
		.filter_by(type="auditions") \
		.join(Show, Post.show_id == Show.id) \
		.filter(Show.date > datetime.now()) \
		.order_by(Show.date.asc()) \
		.order_by(Post.date.desc()) \
		.with_entities(
		Post.date,
		Post.title,
		Post.content,
		Show.title.label("show_title"),
		Show.subtitle.label("show_subtitle")
	) \
		.first()

	# print(post)

	return render_template(
		"auditions.html",
		post=post,
		css="frontpage.css"
	)


@bp.route("/search", methods=["GET"])
def search():
	class Result:
		def __init__(self, link, title, searchable, type):
			self.link = link
			self.title = title
			self.searchable = searchable
			self.type = type

	results = []

	for result in Show.query.filter(Show.date < datetime.now()).order_by(Show.date).all():
		searchable = " ".join([
			result.title or "",
			result.subtitle or "",
			str(result.date.year),
			result.season or "",
			result.text_blob or "",
			result.author or "",
			result.show_type or "",
			result.genre or ""
		])
		results.append(
			Result(
				f"/past-show/{result.id}/{'-'.join(result.title.split(' '))}",
				result.title,
				searchable,
				"Show"
			)
		)

	for result in Post.query \
			.filter(Post.date < datetime.now()) \
			.filter_by(type="blog") \
			.order_by(Post.date).all():
		searchable = " ".join([
			result.title or "",
			result.type or "",
			result.content or ""
		])
		results.append(
			Result(
				f"/blog/{result.id}",
				result.title,
				searchable,
				"Blog"
			)
		)
	for result in Post.query \
			.filter(Post.date < datetime.now()) \
			.filter(or_(Post.type == "public", Post.type == "auditions")) \
			.order_by(Post.date.desc()).all():
		searchable = " ".join([
			result.title or "",
			result.type or "",
			result.content or ""
		])
		results.append(
			Result(
				f"/blog/{result.id}",
				result.title,
				searchable,
				"Post"
			)
		)

	users = {}
	members = []
	for member in Member.query.all():
		if member.associated_user is not None:
			if member.associated_user not in users.keys():
				user = User.query.filter_by(id=member.associated_user).first()
				for i in Member.query.filter_by(associated_user=member.associated_user).all():
					users.setdefault(member.associated_user, []).append(
						MemberRenderer(
							i,
							user
						)
					)
		else:
			members.append(
				MemberRenderer(
					member
				)
			)

	for result in [*users.values(), *members]:
		if isinstance(result, list):
			renderer = result[0]
			searchable = " ".join([
				f"{i.as_firstname} {i.as_lastname}"
				if i.has_diff else
				f"{i.firstname} {i.lastname}"
				for i in result
			])
		else:
			renderer = result
			searchable = " ".join([
				result.firstname,
				result.lastname
			])
		results.append(
			Result(
				renderer.get_link(),
				f"{renderer.firstname} {renderer.lastname}",
				searchable,
				"Member"
			)
		)
	return render_template(
		"search.html",
		results=results,
		js="quicksearch.js",
		css="search.css"
	)


@bp.route("/blog", methods=["GET"])
def blogs():
	posts = Post.query.filter_by(type="blog").order_by(Post.date.desc()).all()
	return render_template(
		"blogs.html",
		template={True: "blank_template.html", False: "layout.html"}["embedded" in request.args],
		embedded={True: "embedded", False: ""}["embedded" in request.args],
		css="blogs.css",
		posts=posts
	)


@bp.route("/blog/latest", methods=["GET"])
def latest_blog():
	post = Post.query.filter_by(type="blog").order_by(Post.date.desc()).first_or_404()
	return redirect("/".join(["/blog", post.id]))


@bp.route("/blog/<post_id>", methods=["GET"])
def blog_post(post_id):
	post = Post.query.filter_by(id=post_id).first_or_404()
	author = User.query.filter_by(id=post.author).first()
	post.views += 1
	db.session.commit()
	return render_template(
		"post.html",
		template={True: "blank_template.html", False: "layout.html"}["embedded" in request.args],
		embedded={True: "embedded", False: ""}["embedded" in request.args],
		post=post,
		author=author,
		css="post.css"
	)


@bp.get("/blog_img/<blog_id>/<int:image_no>")
def blog_img(blog_id, image_no):
	img = BlogImage.query.get((blog_id, image_no)).image
	if img is not None:
		return make_response(img)
	else:
		abort(404)


@bp.route("/past-shows")
def past_shows():
	shows = Show.query \
		.filter(Show.date < datetime.now()) \
		.order_by(Show.date.desc()) \
		.all()
	return render_template(
		"past_shows.html",
		shows=shows,
		manage_shows=False,
		no_portal=True,
		css="past_shows.css",
		js=["past_shows.js", "quicksearch.js"]
	)


@bp.route("/past-shows/<show_id>", methods=["GET"])
def past_show_redirect(show_id):
	show = Show.query.filter_by(id=show_id).first_or_404()
	title = show.title.lower().replace(" ", "-")
	return redirect("/".join([show_id, title]))


@bp.route("/past-shows/<show_id>/<test>")
def past_show_page(show_id, test):
	test += " "

	show = Show.query.filter_by(id=show_id).first_or_404()

	raw_cast = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="cast") \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
		MSL.show_id,
		MSL.cast_or_crew,
		MSL.role_name,
		Member.id,
		Member.firstname,
		Member.lastname,
		Member.associated_user
	) \
		.order_by(MSL.order_val) \
		.all()
	cast = {}
	for member in raw_cast:
		user = User.query.filter_by(id=member.associated_user).first()
		cast.setdefault(member.role_name, []).append(MemberRenderer(member, user))

	raw_crew = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="crew") \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
		MSL.show_id,
		MSL.cast_or_crew,
		MSL.role_name,
		Member.id,
		Member.firstname,
		Member.lastname,
		Member.associated_user
	) \
		.order_by(MSL.order_val) \
		.all()
	crew = {}
	for member in raw_crew:
		user = User.query.filter_by(id=member.associated_user).first()
		crew.setdefault(member.role_name, []).append(MemberRenderer(member, user))

	photos = ShowPhotos.query.filter_by(show_id=show_id, photo_type="photo").all()
	videos = ShowPhotos.query.filter_by(show_id=show_id, photo_type="video").all()

	if "embedded" in request.args.keys():
		return render_template(
			"past_show_photos.html",
			show=show,
			cast=cast,
			crew=crew,
			photos=photos,
			videos=videos,
			title=show.title,
			css="past_show_page.css",
			js="past_show_page.js"
		)
	else:

		return render_template(
			"past_show_page.html",
			show=show,
			cast=cast,
			crew=crew,
			photos=photos,
			videos=videos,
			title=show.title,
			css="past_show_page.css",
			js="past_show_page.js"
		)


@bp.route("/past-shows/u/<user_id>")
def u_redirect(user_id):
	user = User.query.filter_by(id=user_id).first_or_404()
	page_title = "-".join([user.firstname, user.lastname])
	return redirect("/".join([user_id, page_title]))


@bp.route("/past-shows/u/<user_id>/<test>")
def u(user_id, test):
	test += " "
	user_members = [
		i[0] for i in
		Member.query
		.filter(Member.associated_user == user_id)
		.with_entities(Member.id)
		.all()
	]

	msls = MSL.query \
		.filter(MSL.member_id.in_(user_members)) \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
		MSL.show_id,
		MSL.cast_or_crew,
		MSL.role_name,
		Member.id,
		Member.firstname,
		Member.lastname,
		Member.associated_user
	) \
		.all()

	user = User.query.filter_by(id=user_id).first_or_404()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link, user))

	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		no_portal=True,
		user=user,
		js="past_shows.js",
		css="past_shows.css"
	)


@bp.route("/past-shows/m/<member_id>")
def m_redirect(member_id):
	member = Member.query.filter_by(id=member_id).first_or_404()
	page_title = "-".join([member.firstname, member.lastname])
	return redirect("/".join([member_id, page_title]))


@bp.route("/past-shows/m/<member_id>/<test>")
def m(member_id, test):
	test += " "
	member = Member.query.filter_by(id=member_id).first_or_404()
	msls = MSL.query \
		.filter(MSL.member_id == member_id) \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
			MSL.show_id,
			MSL.cast_or_crew,
			MSL.role_name,
			Member.id,
			Member.firstname,
			Member.lastname,
			Member.associated_user
		).all()

	# user = User.query.filter_by(id=user_id).first()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link))

	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		no_portal=True,
		user=member,
		js="past_shows.js",
		css="past_shows.css"
	)


@bp.route("/lorem", methods=["GET"])
def lorem():
	# text = lorem.paragraphs(20)
	return render_template("lorem.html", lorem=lorem_func.paragraphs(30), css="frontpage.css")


@bp.route("/database", methods=["GET"])
def database():
	stats = {
		"Shows": Show.query.count(),
		"Members": Member.query.count(),
		"Cast/Crew Roles": MSL.query.count(),
		"Blogposts": BlogPost.query.count(),
		"Photos": ShowPhotos.query.count()
	}
	return render_template("database.html", stats=stats, css="frontpage.css")


@bp.route("/about-us")
def about():
	return render_template(
		"about-us.html",
		maps_url=KeyValue.query.filter_by(key="maps-url").first(),
		about=KeyValue.query.filter_by(key="about").first_or_404(),
		css="frontpage.css"
	)


@bp.route("/tickets")
def tickets():
	return render_template(
		"tickets.html",
		css="frontpage.css"
	)


@app.errorhandler(401)
@bp.route("/members", methods=["GET", "POST"])
def members(*args):
	if current_user.is_authenticated:
		return redirect(url_for("members_routes.dashboard"))
	else:
		if request.method == "POST":
			user = User.query.filter_by(email=request.form['email']).first()
			if user is not None and user.verify_password(request.form['password']):
				if user.otp_secret != "" and user.otp_secret is not None:
					session['email'] = request.form['email']
					return redirect(url_for("routes.otp"))
				else:
					session['set_password'] = request.form.get('password') == user.id
					login_user(user)
					return redirect(url_for('members_routes.dashboard'))
			else:
				return redirect(url_for("routes.members"))
		elif request.method == "GET":
			files = [
				MemberPost(
					id=i.id,
					title=i.name,
					date=i.date,
					type="file"
				) for i in Files.query
					.filter_by(show_id="members_public")
					.all()
			]

			return render_template(
				"members.html",
				files=files,
				no_portal=True,
				css=["m_dashboard.css", "members.css"]
				# css="members.css"
			)


@bp.route("/members/otp", methods=["GET", "POST"])
def otp():
	if request.method == "GET":
		if 'email' not in session:
			return redirect(url_for('routes.members'))
		return render_template("otp.html", css="members.css")
	else:
		user = User.query.filter_by(email=session['email']).first()
		totp = pyotp.TOTP(user.otp_secret)
		session.pop('email', None)
		if totp.verify(request.form['otp']):
			login_user(user)
			return redirect(url_for("members_routes.dashboard"))
		else:
			return redirect(url_for("routes.members"))


@bp.route("/js/<string:filename>", methods=["GET"])
def js(filename):
	fp = 'static/js/' + filename
	try:
		response = make_response(send_file(fp.replace("\\", "/")))
		response.headers['mimetype'] = 'text/javascript'
		return response
	except OSError:
		abort(404)


@bp.route("/css/<string:filename>", methods=["GET"])
def css(filename):
	fp = 'static/css/' + filename
	try:
		response = make_response(send_file(fp.replace("\\", "/")))
		response.headers['mimetype'] = 'text/css'
		return response
	except OSError:
		abort(404)


@bp.get("/sounds/<filename>")
def sound(filename):
	if filename not in app.available_sounds:
		abort(404)
	else:
		response = send_from_directory(app.sounds_path, filename)
		return response


@bp.get("/favicon.svg")
def favicon():
	response = Response(KeyValue.query.filter_by(key="site_logo").first().value, mimetype='image/svg+xml')
	return response


# @bp.route("/emrg")
# def emergency_user():
# 	kwargs = {
# 		"email": "test2@example.com",
# 		"password": "test"
# 	}
# 	used_ids = [value[0] for value in User.query.with_entities(User.id).all()]
# 	new_id = corha.rand_string(kwargs["email"], 16, used_ids)
# 	kwargs["id"] = new_id
# 	new_user = User(**kwargs, otp_secret=pyotp.random_base32())
# 	db.session.add(new_user)
# 	db.session.commit()
#
# 	return redirect(url_for("frontpage"))


@bp.route("/accessibility")
def accessibility():
	if request.args.get('theme') is not None:
		print(request.args.get('theme'))
		session["theme"] = request.args.get('theme')
	if request.args.get('fontsize') is not None:
		print(request.args.get('fontsize'))
		session["fontsize"] = request.args.get('fontsize')

	session.modified = True

	return redirect(request.referrer)


@bp.route("/tempest")
def tempest_redirect():
	return redirect("/past-shows/L2hhNXIZPeXgGyY/the-tempest")
# TODO: change this to allow configuring custom redirects through admin settings


@bp.route("/test")
def test():
	pprint([x.rule for x in app.url_map.iter_rules()])
	return "test"

@bp.route("/user")
def test_user():
	if current_user.is_authenticated:
		return current_user.email
	else:
		return "Anon"
