import io
import re
import string
from datetime import datetime
from pprint import pprint
from urllib.parse import urlparse
from lorem_text import lorem as lorem_func
import corha
import pyotp
import csv
# import json

from flask import abort, make_response, redirect, render_template, Response, send_file, send_from_directory, url_for, \
	request, session
from flask_login import login_required, login_user, current_user  # , login_required, logout_user
from sqlalchemy import or_, and_
from werkzeug.exceptions import HTTPException

from webapp import app, db
from webapp.models import BlogImage, BlogPost, KeyValue, Member, Post, Show, ShowPhotos, User, MemberShowLink as MSL
from webapp.svgs import blog_icon, drama, eye, fb_icon, ig_icon, other_icon, magnify, trash, tw_icon, cross


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
		if self.has_user:
			return "/past-shows/u/" + self.id
		else:
			return "/past-shows/m/" + self.id


@app.context_processor
def inject_nav():
	icons = {
		"fb_icon": fb_icon,
		"tw_icon": tw_icon,
		"ig_icon": ig_icon,
		"other_icon": other_icon,
		"blog_icon": blog_icon,
		"search": magnify,
		"eye": eye,
		"trash": trash,
		"x": cross,
		"drama": drama
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
		if "facebook" in i:
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

	if (db_latest_blog := Post.query.filter_by(type="blog").order_by(Post.date.desc()).first()) is not None:
		web_config["latest_blog"] = (db_latest_blog.date.strftime("%b %Y"), db_latest_blog.title,)

	if (db_latest_show := Show.query.filter(Show.date < datetime.now()).order_by(Show.date.desc()).first()) is not None:
		web_config["last_show"] = (db_latest_show.title, f"/past-shows/{db_latest_show.id}",)

	m_shows = Show.query\
		.order_by(Show.date.desc())\
		.limit(4)\
		.all()

	session.permanent = True

	return dict(
		nav=nav,
		socials=socials,
		web_config=web_config,
		icons=icons,
		m_shows=m_shows
	)


@app.route("/", methods=["GET"])
def frontpage():
	latest_show = Show.query\
		.filter(Show.date < datetime.now())\
		.order_by(Show.date.desc())\
		.first()

	all_photos = ShowPhotos.query\
		.filter_by(show_id=latest_show.id)\
		.all()

	photos = []
	for i in all_photos:
		size = i.photo_desc.split(",")
		if size[0] > size[1]:
			photos.append(i)

		if len(photos) == (5-int(KeyValue.query.filter_by(key="tickets-active").first().value)):
			break

	post = Post.query\
		.filter(or_(Post.type == "public", Post.type == "auditions"))\
		.join(Show, Post.show_id == Show.id)\
		.filter(Show.date > datetime.now())\
		.order_by(Show.date.asc())\
		.order_by(Post.date.desc())\
		.with_entities(
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle")
		)\
		.first()

	if post is None:
		post = Show.query \
			.filter(Show.date > datetime.now()) \
			.order_by(Show.date.asc()) \
			.with_entities(
				Show.title.label("show_title"),
				Show.subtitle.label("show_subtitle")
			)\
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


@app.get("/links")
def links():
	return render_template(
		"layout.html",
		css="links.css"
	)


@app.route("/auditions", methods=["GET"])
def auditions():
	post = Post.query\
		.filter_by(type="auditions")\
		.join(Show, Post.show_id == Show.id)\
		.filter(Show.date > datetime.now())\
		.order_by(Show.date.asc())\
		.order_by(Post.date.desc())\
		.with_entities(
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle")
		)\
		.first()

	# print(post)

	return render_template(
		"auditions.html",
		post=post,
		css="frontpage.css"
	)


@app.route("/search", methods=["GET"])
def search():
	results = {
		"Shows": [],
		"Blogposts": [],
		"Members": [],
		"Users": {},
	}

	if (arg := request.args.get("search")) is not None:
		ilike_arg = "%" + arg + "%"
		results["Shows"] = Show.query.filter(
			or_(
				Show.title.ilike(ilike_arg),
				Show.subtitle.ilike(ilike_arg),
				Show.season.ilike(ilike_arg),
				Show.show_type.ilike(ilike_arg),
				Show.genre.ilike(ilike_arg),
				Show.author.ilike(ilike_arg)
			)
		).all()
		results["Blogposts"] = BlogPost.query.filter(
			or_(
				BlogPost.title.ilike(ilike_arg),
				BlogPost.content.ilike(ilike_arg)
			)
		).all()

		member_searches = [
			*[Member.firstname.ilike(x) for x in arg.split(" ")],
			*[Member.lastname.ilike(x) for x in arg.split(" ")]
		]

		members = Member.query.filter(
			or_(
				*member_searches
			)
		).all()

		results["Users"] = {}
		results["Members"] = []

		for member in members:
			if member.associated_user is not None:
				if member.associated_user not in results["Users"].keys():
					user = User.query.filter_by(id=member.associated_user).first()
					for i in Member.query.filter_by(associated_user=member.associated_user).all():
						results["Users"].setdefault(member.associated_user, []).append(
							MemberRenderer(
								i,
								user
							)
						)
			else:
				results["Members"].append(
					MemberRenderer(
						member
					)
				)

		#  = BlogPost.query.filter(
		# 	or_(
		# 		BlogPost.title.ilike(ilike_arg),
		# 		BlogPost.content.ilike(ilike_arg)
		# 	)
		# ).all()
	else:
		arg = ""
	return render_template(
		"search.html",
		arg=arg,
		results=results,
		css="search.css"
	)


@app.route("/blog", methods=["GET"])
def blogs():
	posts = Post.query.filter_by(type="blog").order_by(Post.date.desc()).all()
	return render_template(
		"blogs.html",
		template={True: "blank_template.html", False: "layout.html"}["embedded" in request.args],
		embedded={True: "embedded", False: ""}["embedded" in request.args],
		css="blogs.css",
		posts=posts
	)


@app.route("/blog/latest", methods=["GET"])
def latest_blog():
	post = Post.query.filter_by(type="blog").order_by(Post.date.desc()).first_or_404()
	return redirect("/".join(["/blog", post.id]))


@app.route("/blog/<post_id>", methods=["GET"])
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


@app.get("/blog_img/<blog_id>/<int:image_no>")
def blog_img(blog_id, image_no):
	img = BlogImage.query.get((blog_id, image_no)).image
	if img is not None:
		return make_response(img)
	else:
		abort(404)


@app.route("/past-shows")
def past_shows():
	shows = Show.query \
		.filter(Show.date < datetime.now()) \
		.order_by(Show.date.desc()) \
		.all()
	return render_template(
		"past_shows.html",
		shows=shows,
		css="past_shows.css",
		js="past_shows.js"
	)


@app.route("/past-shows/<show_id>", methods=["GET"])
def past_show_redirect(show_id):
	show = Show.query.filter_by(id=show_id).first_or_404()
	title = show.title.lower().replace(" ", "-")
	return redirect("/".join([show_id, title]))


@app.route("/past-shows/<show_id>/<test>")
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


@app.route("/past-shows/u/<user_id>")
def u_redirect(user_id):
	user = User.query.filter_by(id=user_id).first_or_404()
	page_title = "-".join([user.firstname, user.lastname])
	return redirect("/".join([user_id, page_title]))


@app.route("/past-shows/u/<user_id>/<test>")
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

	user = User.query.filter_by(id=user_id).first()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link, user))

	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		user=user,
		js="past_shows.js",
		css="past_shows.css"
	)


@app.route("/past-shows/m/<member_id>")
def m_redirect(member_id):
	member = Member.query.filter_by(id=member_id).first_or_404()
	page_title = "-".join([member.firstname, member.lastname])
	return redirect("/".join([member_id, page_title]))


@app.route("/past-shows/m/<member_id>/<test>")
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
		) \
		.all()

	# user = User.query.filter_by(id=user_id).first()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link))

	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		user=member,
		js="past_shows.js",
		css="past_shows.css"
	)


@app.route("/lorem", methods=["GET"])
def lorem():
	# text = lorem.paragraphs(20)
	return render_template("lorem.html", lorem=lorem_func.paragraphs(30), css="frontpage.css")


@app.route("/database", methods=["GET"])
def database():
	stats = {
		"Shows": Show.query.count(),
		"Members": Member.query.count(),
		"Cast/Crew Roles": MSL.query.count(),
		"Blogposts": BlogPost.query.count(),
		"Photos": ShowPhotos.query.count()
	}
	return render_template("database.html", stats=stats, css="frontpage.css")


@app.get("/csv")
@login_required
def csv_download():
	if current_user.role == "admin":
		valid = False
		table = request.args.get("table")
		if table == "shows":
			valid = True
			model = Show
			data = model.query.order_by(Show.date.desc()).all()
		elif table == "members":
			valid = True
			model = Member
			data = model.query.order_by(Member.lastname.asc()).all()
		elif table == "roles":
			valid = True
			model = MSL
			data = model.query\
				.order_by(MSL.show_id.asc())\
				.order_by(MSL.cast_or_crew.asc())\
				.order_by(MSL.order_val.asc())\
				.all()

		if valid:
			file = io.StringIO()
			outcsv = csv.writer(file)
			headings = [heading.name for heading in model.__mapper__.columns]
			outcsv.writerow(headings)
			[outcsv.writerow([getattr(curr, column.name) for column in model.__mapper__.columns]) for curr in data]
			response = make_response(file.getvalue())
			response.headers["Content-Disposition"] = f'attachment; filename="{table}.csv'
			file.close()

			return response


@app.route("/about-us")
def about():
	return render_template(
		"about-us.html",
		maps_url=KeyValue.query.filter_by(key="maps-url").first(),
		about=KeyValue.query.filter_by(key="about").first_or_404(),
		css="frontpage.css"
	)


@app.route("/tickets")
def tickets():
	return render_template(
		"tickets.html",
		css="frontpage.css"
	)


@app.route("/members", methods=["GET", "POST"])
def members():
	if current_user.is_authenticated:
		return redirect(url_for("dashboard"))
	else:
		if request.method == "POST":
			user = User.query.filter_by(email=request.form['email']).first()
			if user is not None and user.verify_password(request.form['password']):
				if user.otp_secret != "" and user.otp_secret is not None:
					session['email'] = request.form['email']
					return redirect(url_for("otp"))
				else:
					session['set_password'] = request.form.get('password') == user.id
					login_user(user)
					return redirect(url_for('dashboard'))
			else:
				return redirect(url_for("members"))
		else:
			return render_template("members.html", css="members.css")


@app.route("/members/otp", methods=["GET", "POST"])
def otp():
	if request.method == "GET":
		if 'email' not in session:
			return redirect(url_for('members'))
		return render_template("otp.html", css="members.css")
	else:
		user = User.query.filter_by(email=session['email']).first()
		totp = pyotp.TOTP(user.otp_secret)
		session.pop('email', None)
		if totp.verify(request.form['otp']):
			login_user(user)
			return redirect(url_for("frontpage"))
		else:
			return redirect(url_for("members"))


@app.route("/js/<string:filename>", methods=["GET"])
def js(filename):
	fp = 'static/js/' + filename
	response = make_response(send_file(fp.replace("\\", "/")))
	response.headers['mimetype'] = 'text/javascript'
	return response


@app.route("/css/<string:filename>", methods=["GET"])
def css(filename):
	fp = 'static/css/' + filename
	response = make_response(send_file(fp.replace("\\", "/")))
	response.headers['mimetype'] = 'text/css'
	return response


@app.get("/sounds/<filename>")
def sound(filename):
	if filename not in app.available_sounds:
		abort(404)
	else:
		response = send_from_directory(app.sounds_path, filename)
		return response


@app.get("/favicon.svg")
def favicon():
	response = Response(KeyValue.query.filter_by(key="site_logo").first().value, mimetype='image/svg+xml')
	return response


@app.route("/emrg")
def emergency_user():
	kwargs = {
		"email": "test2@example.com",
		"password": "test"
	}
	used_ids = [value[0] for value in User.query.with_entities(User.id).all()]
	new_id = corha.rand_string(kwargs["email"], 16, used_ids)
	kwargs["id"] = new_id
	new_user = User(**kwargs, otp_secret=pyotp.random_base32())
	db.session.add(new_user)
	db.session.commit()

	return redirect(url_for("frontpage"))


@app.errorhandler(HTTPException)
def page_not_found(e):

	if int(str(e)[:3]) == 404:
		if (page := re.search("^/((new-year)|(spring)|(autumn))-\d{4}", request.path)) is not None:
			aim = page.group()[1:].rsplit("-", 1)
			show = Show.query\
				.filter_by(season=aim[0].replace("-", " ").title())\
				.filter(
					and_(
						Show.date > datetime.fromisocalendar(int(aim[1]), 1, 1),
						Show.date < datetime.fromisocalendar(int(aim[1])+1, 1, 1)
					)
				).first()
			if show is not None:
				return redirect(f"/past-shows/{show.id}/{show.title.lower().replace(' ', '-')}")
	print(int(str(e)[:3]))
	return render_template('error.html', error=e, css="frontpage.css"), int(str(e)[:3])


@app.route("/accessibility")
def accessibility():
	if request.args.get('theme') is not None:
		print(request.args.get('theme'))
		session["theme"] = request.args.get('theme')
	if request.args.get('fontsize') is not None:
		print(request.args.get('fontsize'))
		session["fontsize"] = request.args.get('fontsize')

	session.modified = True

	return redirect(request.referrer)


@app.route("/tempest")
def tempest_redirect():
	return redirect("/past-shows/L2hhNXIZPeXgGyY/the-tempest")
	# TODO: change this to allow configuring custom redirects through admin settings

