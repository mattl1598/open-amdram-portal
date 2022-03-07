from flask import abort, make_response, redirect, render_template, send_file, url_for
from webapp import app
import json


class NavItem():
	def __init__(self, t, l):
		title = t
		link = l


@app.context_processor
def inject_nav():
	nav = [
		{"title":"Home", "link":"/", "is_active": "active"},
		{"title":"Blog", "link":"/blog", "is_active": "inactive"},
		{"title":"Past Shows", "link":"/past-shows", "is_active": "inactive"},
		{"title":"Auditions", "link":"/auditions", "is_active": "inactive"},
		{"title":"About Us", "link":"/about-us", "is_active": "inactive"},
		{"title":"Members", "link":"/members", "is_active": "inactive"}
	]
	print("test")
	return dict(nav=nav)


@app.route("/")
def frontpage():
	return render_template("frontpage.html", css="frontpage.css")


@app.route("/css/<string:filename>", methods=["GET"])
def css(filename):
	fp = 'static/css/' + filename
	response = make_response(send_file(fp.replace("\\", "/")))
	response.headers['mimetype'] = 'text/css'
	return response