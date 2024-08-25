import json
import sass
from datetime import datetime
from pprint import pprint
import requests
from flask_login import current_user, login_user, logout_user
from sqlalchemy import literal_column, or_, func, case, text
from sqlalchemy.dialects.postgresql import aggregate_order_by

from flask import abort, Blueprint, make_response, redirect, jsonify, \
	render_template, Response, send_file, send_from_directory, url_for, request, session
from flask import current_app as app

from webapp.models import *
from webapp.models import MemberShowLink as MSL
from webapp.react_permissions import default_role_permissions, get_allowed_pages

bp = Blueprint("react_support_routes", __name__)


@bp.route("/react/<string:filename>", methods=["GET"])
@bp.route("/static/react/<string:filename>", methods=["GET"])
def react(filename):
	if app.envs.app_environment == "development":
		fp = 'static/reactx/' + filename.replace('.js', '.jsx')
		mimetype = 'text/jsx'
	else:
		fp = 'static/react/' + filename
		mimetype = 'text/js'
	try:
		response = make_response(send_file(fp.replace("\\", "/")))
		response.headers['mimetype'] = mimetype
		return response
	except OSError:
		abort(404)


@bp.route("/css/<string:filename>", methods=["GET"])
@bp.route("/static/css/<string:filename>", methods=["GET"])
def css(filename):
	if app.envs.app_environment != "development":
		fp = 'static/css/' + filename
		try:
			response = make_response(send_file(fp.replace("\\", "/")))
			response.headers['mimetype'] = 'text/css'
			return response
		except OSError:
			abort(404)
	else:
		fp = 'webapp/static/scss/' + filename.replace(".css", ".scss")
		try:
			output = sass.compile(filename=fp.replace("\\", "/"))
			response = Response(
				output,
				mimetype='text/css'
			)
			return response
		except OSError as e:
			print(e)
			abort(404)


# noinspection PyUnresolvedReferences
@bp.get("/sounds/<filename>")
def sound(filename):
	if filename not in app.available_sounds:
		abort(404)
	else:
		response = send_from_directory(app.sounds_path, filename)
		return response


@bp.get("/favicon.svg")
@bp.get("/static/favicon.svg")
def favicon():
	response = Response(KeyValue.query.filter_by(key="site_logo").first().value, mimetype='image/svg+xml')
	return response


@bp.route("/accessibility")
def accessibility():
	if request.args.get('theme') is not None:
		session["theme"] = request.args.get('theme')
	if request.args.get('fontsize') is not None:
		session["fontsize"] = request.args.get('fontsize')

	session.modified = True

	return redirect(request.referrer)
