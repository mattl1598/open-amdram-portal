from flask import Blueprint, request, session
from flask_login import current_user
import datetime

from webapp.models import *

bp = Blueprint("analytics_routes", __name__)


@bp.before_request
def before_request():
	if session.get("session_id") is None:
		session["session_id"] = corha.rand_string(datetime.datetime.utcnow().isoformat(), 64, [])
		session.modified = True


@bp.after_request
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
			user_agent=request.user_agent.string,
			code=response.status_code
		)
		db.session.add(new_log)
		db.session.commit()
	return response
