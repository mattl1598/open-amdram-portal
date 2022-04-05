import corha
import pyotp
from flask import abort, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import User
from webapp.svgs import fb_icon, ig_icon, other_icon, tw_icon
import json
from lorem_text import lorem as lorem_func


class NavItem():
	def __init__(self, t, l):
		title = t
		link = l


@app.context_processor
def inject_nav():
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

	socials = [
		{"type": "facebook", "link": "www.facebook.com", "text": "Facebook", "icon": fb_icon},
		{"type": "twitter", "link": "www.twitter.com", "text": "Twitter", "icon": tw_icon},
		{"type": "instagram", "link": "www.instagram.com", "text": "Instagram", "icon": ig_icon},
		{"type": "other", "link": "www.google.com", "text": "Other", "icon": other_icon}
	]

	return dict(nav=nav, socials=socials)


@app.route("/", methods=["GET"])
def frontpage():
	return render_template("frontpage.html", css="frontpage.css")


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

