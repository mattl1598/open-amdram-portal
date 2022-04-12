import string
from itertools import groupby
from operator import attrgetter
from urllib.parse import urlparse
import corha
import pyotp
from flask import abort, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import BlogImage, BlogPost, KeyValue, Member, Show, User, MemberShowLink as MSL
from webapp.svgs import blog_icon, fb_icon, ig_icon, other_icon, tw_icon
import json
from lorem_text import lorem as lorem_func


class NavItem():
	def __init__(self, t, l):
		title = t
		link = l


@app.context_processor
def inject_nav():
	icons = {
		"fb_icon": fb_icon,
		"tw_icon": tw_icon,
		"ig_icon": ig_icon,
		"other_icon": other_icon,
		"blog_icon": blog_icon
	}

	route_split = ["/"+i for i in request.url_rule.rule[1:].split("/")]
	nav = [
		{"title": "Home", "link": "/"},
		{"title": "Lorem", "link": "/lorem"},
		{"title": "Blog", "link": "/blog"},
		{"title": "Past Shows", "link": "/past-shows"},
		{"title": "Auditions", "link": "/auditions"},
		{"title": "About Us", "link": "/about-us"},
		{"title": "Members", "link": "/members"}
	]

	for i in range(0, len(nav)):
		nav[i]["is_active"] = (route_split[0] == nav[i]["link"])

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
		"site-name": KeyValue.query.filter_by(key="site-name").first().value
	}

	if (latest_blog := BlogPost.query.order_by(BlogPost.date.desc()).first()) is not None:
		web_config["latest_blog"] = (latest_blog.date.strftime("%b %Y"), latest_blog.title,)

	return dict(nav=nav, socials=socials, web_config=web_config, icons=icons)


@app.route("/", methods=["GET"])
def frontpage():
	return render_template("frontpage.html", css="frontpage.css")


@app.route("/blog", methods=["GET"])
def blogs():
	posts = BlogPost.query.order_by(BlogPost.date.desc()).all()
	return render_template("blogs.html", css="blogs.css", posts=posts)


@app.route("/blog/latest", methods=["GET"])
def latest_blog():
	post = BlogPost.query.order_by(BlogPost.date.desc()).first_or_404()
	return redirect("/".join(["/blog", post.id]))


@app.route("/blog/<post_id>", methods=["GET"])
def blog_post(post_id):
	post = BlogPost.query.filter_by(id=post_id).first_or_404()
	author = User.query.filter_by(id=post.author).first()
	post.views += 1
	db.session.commit()
	return render_template(
		"post.html",
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
	shows = Show.query.order_by(Show.date.desc()).all()
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
	show = Show.query.filter_by(id=show_id).first_or_404()
	raw_cast = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="cast")\
		.with_entities(MSL.role_name, MSL.member_id)\
		.all()

	cast = {}
	for i in raw_cast:
		cast.setdefault(i[0], []).append(i[1])

	raw_crew = MSL.query\
		.filter_by(show_id=show_id, cast_or_crew="crew")\
		.with_entities(MSL.role_name, MSL.member_id)\
		.all()

	crew = {}
	for i in raw_crew:
		crew.setdefault(i[0], []).append(i[1])

	smr = MSL.query\
		.filter_by(show_id=show_id)\
		.join(Member)\
		.with_entities(Member.id, Member.firstname, Member.lastname) \
		.distinct()\
		.all()

	show_members = {i.id: " ".join([i.firstname, i.lastname]) for i in smr}

	print(show_members)

	return render_template(
		"past_show_page.html",
		show=show,
		cast=cast,
		crew=crew,
		show_members=show_members,
		css="past_show_page.css"
	)


@app.route("/lorem", methods=["GET"])
def lorem():
	# text = lorem.paragraphs(20)
	return render_template("lorem.html", lorem=lorem_func.paragraphs(50), css="frontpage.css")


@app.route("/members", methods=["GET", "POST"])
def members():
	if current_user.is_authenticated:
		return redirect(url_for("dashboard"))
	else:
		if request.method == "POST":
			print(request.form)
			user = User.query.filter_by(email=request.form['email']).first()
			if user is not None and user.verify_password(request.form['password']):
				if user.otp_secret != "":
					session['email'] = request.form['email']
					return redirect(url_for("otp"))
				else:
					login_user(user)
					return redirect(url_for('frontpage'))
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

