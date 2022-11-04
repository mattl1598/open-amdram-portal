import datetime

from corha import corha
from flask import abort, make_response, redirect, render_template, Response, send_file, send_from_directory, url_for, \
	request, session
from flask_login import login_required, login_user, current_user  # , login_required, logout_user
from sqlalchemy import or_
from werkzeug.exceptions import HTTPException


from webapp.models import BlogImage, BlogPost, KeyValue, Member, Post, Show, ShowPhotos, User, MemberShowLink as MSL, AnalyticsLog
from webapp import app, db


@app.before_request
def before_request():
	if session.get("session_id") is None:
		session["session_id"] = corha.rand_string(datetime.datetime.utcnow().isoformat(), 64, [])
		session.modified = True


@app.after_request
def after_request(response):
	db.session.commit()
	ignored_endpoints = [
		"css",
		"js",
		"get_photo",
		"favicon"
	]
	if request.endpoint not in ignored_endpoints and "None" not in request.url and response.status_code != 302:
		if current_user.is_authenticated:
			email = current_user.email
		else:
			email = None

		new_log = AnalyticsLog(
			id=AnalyticsLog.get_new_id(),
			date=datetime.datetime.utcnow().isoformat(),
			server=request.root_url,
			session_id=session["session_id"],
			session_email=email,
			request_origin=request.referrer,
			request_destination=request.url,
			user_agent=request.user_agent.string
		)
		db.session.add(new_log)
		db.session.commit()
	return response
