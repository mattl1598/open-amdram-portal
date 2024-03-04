from flask import current_app as app,  abort, Blueprint, request, copy_current_request_context
from flask_login import login_user, logout_user, current_user, login_required
from datetime import timedelta, datetime
import requests
from pprint import pprint
from sqlalchemy import and_, extract, func, not_, or_, sql
from webapp.models import Scheduler, SchedulerLog, KeyValue, db
import json

bp = Blueprint("scheduler_routes", __name__)


@bp.after_app_request
def scheduler(response):
	@response.call_on_close
	@copy_current_request_context
	def process_schedules():
		ignored_endpoints = [
			"routes.css",
			"routes.js",
			"photos_routes.get_photo",
			"routes.favicon"
		]
		if request.endpoint not in ignored_endpoints and response.status_code == 200:
			jobs = Scheduler.query.filter(and_(
				Scheduler.next_execution < datetime.utcnow(),
				Scheduler.enabled,
				not_(Scheduler.is_running)
			)).all()
			if jobs:
				for job in jobs:
					job.last_execution = datetime.utcnow()
					job.next_execution = datetime.utcnow() + job.interval
					job.is_running = True
					db.session.add(job)
				db.session.commit()

				results = {}
				for job in jobs:
					headers = {"User-Agent": "OADP_Scheduler"}
					x = requests.get(f"{request.root_url}{job.target_endpoint}", headers=headers)
					if x.headers.get("Content-Type") == "application/json":
						response_json = x.json()
					else:
						response_json = {"msg": "No JSON was received."}
					results[job.id] = {"code": x.status_code, "json": response_json}

				for job in jobs:
					# update run status
					job.is_running = False
					job.last_response_code = results[job.id]["code"]

					log = SchedulerLog(
						id=SchedulerLog.get_new_id(),
						job_id=job.id,
						datetime=job.last_execution,
						response_code=results[job.id]["code"],
						response_json=json.dumps(results[job.id]["json"])
					)
					db.session.add(job)
					db.session.add(log)
				db.session.commit()

	return response
