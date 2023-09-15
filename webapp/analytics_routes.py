import collections

from flask import Blueprint, render_template, request, session
from flask_login import current_user, login_required
import datetime
import distinctipy as distinctipy
from datetime import timedelta  # , datetime
from sqlalchemy import and_, extract, func, not_, or_, sql
import re
import tld as tld

from webapp.models import *
from flask import current_app as app

bp = Blueprint("analytics_routes", __name__)


@bp.before_app_request
def before_app_request():
	if session.get("session_id") is None:
		session["session_id"] = corha.rand_string(datetime.utcnow().isoformat(), 64, [])
		session.modified = True


@bp.after_app_request
def after_app_request(response):
	ignored_endpoints = [
		"routes.css",
		"routes.js",
		"photos_routes.get_photo",
		"routes.favicon"
	]
	if request.endpoint not in ignored_endpoints and "None" not in request.url and response.status_code != 302:
		if current_user.is_authenticated:
			email = current_user.email
		else:
			email = None

		new_log = AnalyticsLog(
			id=AnalyticsLog.get_new_id(),
			date=datetime.utcnow().isoformat(),
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

	db.session.commit()
	return response


@bp.route("/members/analytics")
@login_required
def analytics():
	## ?start=2022-12-08T00:00:00&end=2023-01-29
	if request.args.get("start"):
		start_time = datetime.strptime(request.args.get("start"), "%Y-%m-%dT%H:%M:%S")
	else:
		start_time = datetime.utcnow() - timedelta(days=30)
	if request.args.get("end"):
		end_time = datetime.strptime(request.args.get("end"), "%Y-%m-%dT%H:%M:%S")
	else:
		end_time = datetime.utcnow()

	date_filter = and_(
		AnalyticsLog.date > start_time,
		AnalyticsLog.date < end_time
	)

	ip_pattern = re.compile(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
	os_pattern = re.compile(r'Android|iPhone|iPad|Windows|Macintosh|Linux|Xbox')

	# external origins analysis
	# noinspection PyUnresolvedReferences
	# noinspection Duplicates
	raw_external_origins = AnalyticsLog.query\
		.filter(
			date_filter,
			not_(AnalyticsLog.request_origin.ilike('')),
			not_(AnalyticsLog.request_origin.ilike('%.php%')),
			not_(AnalyticsLog.request_destination.ilike('%.php%')),
			not_(AnalyticsLog.user_agent.ilike('%http%')),
			not_(AnalyticsLog.user_agent.ilike('%RepoLookoutBot%')),
			not_(AnalyticsLog.user_agent.ilike('%Expanse, a Palo Alto Networks company%')),
			not_(AnalyticsLog.code == 404),
			not_(AnalyticsLog.request_origin.contains('silchesterplayers.org')),
			AnalyticsLog.server.contains('silchesterplayers.org')
		).with_entities(
			AnalyticsLog.request_origin,
			func.count(AnalyticsLog.request_origin)
		).order_by(func.count(AnalyticsLog.request_origin))\
		.group_by(AnalyticsLog.request_origin)\
		.all()

	external_origins = {
	}

	for result in raw_external_origins:
		if ip_pattern.search(result[0]):
			# external_origins["other_ips"] += result[1]
			stripped = "other_ips"
			external_origins[stripped] = external_origins.setdefault(stripped, 0) + result[1]
		elif "android-app://" in result[0]:
			stripped = "http://" + ".".join(re.sub(r'android-app://', "", result[0]).split("/", 1)[0].split(".")[::-1])

			stripped = tld.get_fld(stripped).replace(tld.get_tld(stripped), "").rstrip(".")
			external_origins[stripped] = external_origins.setdefault(stripped, 0) + result[1]
		else:
			stripped = "http://" + re.sub(r'http://|https://|www.', "", result[0]).split("/", 1)[0]

			stripped = tld.get_fld(stripped).replace(tld.get_tld(stripped), "").rstrip(".")
			external_origins[stripped] = external_origins.setdefault(stripped, 0) + result[1]
	# noinspection PyTypeChecker
	external_origins = collections.OrderedDict(sorted(external_origins.items(), key=lambda x: x[1])[::-1])

	# user agent analysis
	# noinspection PyUnresolvedReferences
	# noinspection Duplicates
	user_agents = AnalyticsLog.query \
		.filter(
			date_filter,
			not_(AnalyticsLog.request_origin.ilike('%.php%')),
			not_(AnalyticsLog.request_destination.ilike('%.php%')),
			not_(AnalyticsLog.user_agent.ilike('%http%')),
			not_(AnalyticsLog.user_agent.ilike('%RepoLookoutBot%')),
			not_(AnalyticsLog.user_agent.ilike('%Expanse, a Palo Alto Networks company%')),
			not_(AnalyticsLog.code == 404),
			AnalyticsLog.server.contains('silchesterplayers.org')
		).with_entities(
			AnalyticsLog.user_agent,
			func.count(AnalyticsLog.user_agent)
		).order_by(func.count(AnalyticsLog.user_agent))\
		.group_by(AnalyticsLog.user_agent)\
		.all()

	os = {}
	device_type = {}
	other_os = []

	for agent, count in user_agents:
		match = os_pattern.findall(agent)

		# If a match is found, return the operating system name
		if match:
			os[match[-1]] = os.setdefault(match[-1], 0) + count
			if match[-1] in ["Android", "iPhone", "iPad"]:
				device_type["Mobile"] = device_type.setdefault("Mobile", 0) + count
			elif match[-1] in ["Windows", "Macintosh", "Linux"]:
				device_type["Desktop"] = device_type.setdefault("Desktop", 0) + count
			else:
				device_type["Other"] = device_type.setdefault("Other", 0) + count
		else:
			os["Other"] = os.setdefault("Other", 0) + count
			other_os.append(agent)

	# user agent analysis
	aggregate = request.args.get("time")

	labels = []
	if aggregate == 'hours':
		# do nothing
		start, end = start_time.replace(minute=0, second=0, microsecond=0), end_time
		delta = timedelta(hours=1)
		form = "%Y-%m-%d-%H"

		query = func.date_part('hour', AnalyticsLog.date)
		outs = [
			extract("YEAR", func.date(AnalyticsLog.date)),
			extract("MONTH", func.date(AnalyticsLog.date)),
			extract("DAY", func.date(AnalyticsLog.date)),
			query
		]
	elif aggregate == 'days' or aggregate is None:
		# group by date
		start, end = start_time.replace(hour=0, minute=0, second=0, microsecond=0), end_time
		delta = timedelta(days=1)
		form = "%Y-%m-%d"

		query = func.date(AnalyticsLog.date)
		outs = [
			extract("YEAR", func.date(AnalyticsLog.date)),
			extract("MONTH", func.date(AnalyticsLog.date)),
			extract("DAY", func.date(AnalyticsLog.date))
		]
	elif aggregate == 'months':
		# group by month
		start, end = start_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0), end_time
		delta = timedelta(days=1)
		form = "%Y-%m"

		query = func.date_part('month', AnalyticsLog.date)
		outs = [
			extract("YEAR", func.date(AnalyticsLog.date)),
			extract("MONTH", func.date(AnalyticsLog.date))
		]
	else:
		raise ValueError('invalid aggregation')

	while start < end:
		labels.append(start.strftime(form))
		start += delta

	# noinspection PyUnresolvedReferences
	# noinspection Duplicates
	requests_date_log = AnalyticsLog.query\
		.filter(
			date_filter,
			not_(AnalyticsLog.request_origin.ilike('%.php%')),
			not_(AnalyticsLog.request_destination.ilike('%.php%')),
			not_(AnalyticsLog.user_agent.ilike('%http%')),
			not_(AnalyticsLog.user_agent.ilike('%RepoLookoutBot%')),
			not_(AnalyticsLog.user_agent.ilike('%Expanse, a Palo Alto Networks company%')),
			not_(AnalyticsLog.code == 404),
			AnalyticsLog.server.contains('silchesterplayers.org')
		).with_entities(
			func.count(query),
			*outs
		).order_by(func.date(AnalyticsLog.date), query)\
		.group_by(func.date(AnalyticsLog.date), query)\
		.all()

	test1 = {
		"-".join([str(int(j)).zfill(2) for j in i[1:]]):
		{
			"x": "-".join([str(int(j)).zfill(2) for j in i[1:]]),
			"y": i[0]
		}
		for i in requests_date_log
	}
	# noinspection PyTypeChecker
	requests_datelog = collections.OrderedDict(sorted({x: test1.setdefault(x, {"x": x, "y": 0}) for x in labels}.items()))

	# noinspection PyUnresolvedReferences
	# noinspection Duplicates
	tickets_date_log = AnalyticsLog.query\
		.filter(
			date_filter,
			not_(AnalyticsLog.request_origin.ilike('%.php%')),
			not_(AnalyticsLog.request_destination.ilike('%.php%')),
			not_(AnalyticsLog.user_agent.ilike('%http%')),
			not_(AnalyticsLog.user_agent.ilike('%RepoLookoutBot%')),
			not_(AnalyticsLog.user_agent.ilike('%Expanse, a Palo Alto Networks company%')),
			not_(AnalyticsLog.code == 404),
			AnalyticsLog.server.contains('silchesterplayers.org'),
			AnalyticsLog.request_destination.ilike('%/tickets%')
		).with_entities(
			func.count(query),
			*outs
		).order_by(func.date(AnalyticsLog.date), query)\
		.group_by(func.date(AnalyticsLog.date), query)\
		.all()

	test2 = {
		"-".join([str(int(j)).zfill(2) for j in i[1:]]):
		{
			"x": "-".join([str(int(j)).zfill(2) for j in i[1:]]),
			"y": i[0]
		}
		for i in tickets_date_log
	}
	# noinspection PyTypeChecker
	tickets_datelog = collections.OrderedDict(sorted({x: test2.setdefault(x, {"x": x, "y": 0}) for x in labels}.items()))

	square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"

	results = app.square.orders.search_orders(
		body={
			"location_ids": [
				"0W6A3GAFG53BH"
			],
			"query": {
				"filter": {
					"date_time_filter": {
						"created_at": {
							"start_at": start_time.strftime(square_date_format)
						}
					},
					"source_filter": {
						"source_names": [
							"Square Online"
						]
					}
				}
			}
		}
	)

	test3 = {}

	for x in results.body.get("orders"):
		date_key = datetime.strptime(x["created_at"], square_date_format).strftime(form)
		test3[date_key] = {
			"x": date_key,
			"y": test3.setdefault(date_key, {"x": date_key, "y": 0})["y"] + 1
		}

	orders_datelog = collections.OrderedDict(
		sorted(
			{
				x: test3.setdefault(x, {"x": x, "y": 0})
				for x in labels
			}.items()
		)
	)

	# noinspection PyUnresolvedReferences
	# noinspection Duplicates
	session_lengths = dict(
		collections.Counter(
			[
				i[0] for i in AnalyticsLog.query
				.filter(
					date_filter,
					not_(AnalyticsLog.request_origin.ilike('%.php%')),
					not_(AnalyticsLog.request_destination.ilike('%.php%')),
					not_(AnalyticsLog.user_agent.ilike('%http%')),
					not_(AnalyticsLog.user_agent.ilike('%RepoLookoutBot%')),
					not_(AnalyticsLog.user_agent.ilike('%Expanse, a Palo Alto Networks company%')),
					not_(AnalyticsLog.code == 404),
					AnalyticsLog.server.contains('silchesterplayers.org')
				).group_by(AnalyticsLog.session_id, )
				.with_entities(
					func.count(AnalyticsLog.session_id)
				).order_by(func.count(AnalyticsLog.session_id))
				.all()
			]
		)
	)

	return render_template(
		"members/analytics.html",
		external_origins=external_origins,
		origins_colours=[
			'#%02x%02x%02x' % tuple(int(round(s*255)) for s in i)
			for i in distinctipy.get_colors(len(external_origins.keys()), pastel_factor=0.7)
		],
		os=os,
		device_type=device_type,
		requests_datelog=list(requests_datelog.values()),
		tickets_datelog=list(tickets_datelog.values()),
		orders_datelog=list(orders_datelog.values()),
		session_lengths=session_lengths,
		css="m_analytics.css"
	)
