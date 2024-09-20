import json
import re
from pprint import pprint

from flask import Blueprint, make_response, redirect, render_template, request, session, abort, jsonify, url_for
from flask_login import current_user, login_required
from datetime import timedelta, datetime

from sqlalchemy import func, or_, text
from webapp.models import *
from flask import current_app as app

from webapp.react_permissions import check_page_permission
from webapp.tickets_routes import collect_orders, OrderInfo

bp = Blueprint("react_tickets_routes", __name__)


def extract_numbers(string):
	# Use regular expression to find all numbers in the string
	numbers = re.findall(r'\d+', string)
	# Convert the first number found to an integer (assuming there's at least one number)
	return "".join(numbers) if numbers else float('inf')


@bp.get("/members/bookings")
def bookings():
	check_page_permission("bookings")
	now = datetime.utcnow()
	end_of_last_show = Show.query.filter(Show.date < now).order_by(Show.date.desc()).first().date + timedelta(days=1)

	mods = db.session.query(func.json_agg(
			func.json_build_object(
				"id", BookingModifications.id,
				"ref", BookingModifications.ref_num,
				"from_item", BookingModifications.from_item,
				"change_quantity", BookingModifications.change_quantity,
				"to_item", BookingModifications.to_item,
				"is_reservation", BookingModifications.is_reservation,
				"mark_as_paid", BookingModifications.mark_as_paid,
				"note", BookingModifications.note,
			)
		)
	).filter(BookingModifications.datetime > end_of_last_show).scalar()

	items = []
	for item in (app.square.catalog.search_catalog_items(
			body={
				"category_ids": [
					"LETDSKQATFDC3IAJITOXQFGT"
				],
				"product_types": [
					"REGULAR"
				],
				"archived_state": "ARCHIVED_STATE_NOT_ARCHIVED"
			}
	).body.get("items") or []):
		items.append(item["item_data"]["name"])

	items = sorted(items, key=extract_numbers)

	performances = db.session.query(
		func.json_agg(
			func.json_build_object(
				"id", text("results.id"),
				"date", text("results.date"),
				"layout", text("results.layout"),
				"seat_assignments", text("results.seat_assignments")
			)
		)
	).select_from(
		db.session.query(
			Performance.id.label("id"),
			Performance.date.label("date"),
			Performance.layout.label("layout"),
			Performance.seat_assignments.label("seat_assignments"),
		).order_by(
			Performance.date.asc()
		).filter(
			Performance.date > datetime.utcnow()
		).subquery().alias("results")
	).scalar()

	# performances = Performance.query.filter(Performance.date > end_of_last_show).order_by(Performance.date.asc()).all()
	data = {
		"type": "bookings",
		"title": "Manage Bookings",
		"mods": mods,
		"performances": performances,
		"items": items,
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/bookings/add_new_performance")
def add_new_performance():
	check_page_permission("bookings")
	next_show = db.session.query(
		Show.id
	).filter(
		Show.date > datetime.utcnow()
	).order_by(Show.date.asc()).limit(1).scalar()

	date_string = request.form.get("datetime")
	if date_string is None:
		return {
			"code": 400,
			"msg": "Invalid date."
		}

	date_from_form = datetime.strptime(date_string, "%Y-%m-%dT%H:%M")

	exists = bool(db.session.query(
		Performance.id
	).filter(
		Performance.date == date_from_form
	).limit(1).scalar())

	if exists:
		return {
			"code": 400,
			"msg": "Performance at that time already exists."
		}

	new_perf = Performance(
		id=Performance.get_new_id(),
		show_id=next_show,
		date=request.form.get("datetime"),
		layout={"rowCount": 1, "hiddenSeats": [], "newSeats": 0, "fullWidth": 12},
		seat_assignments={}
	)
	db.session.add(new_perf)
	db.session.commit()

	return {
		"code": 200,
		"msg": "Successfully added new performance"
	}


@bp.route("/members/bookings/seating/<perf_id>", methods=["GET", "POST"])
def seating_planner(perf_id):
	check_page_permission("bookings")
	if request.method == "POST":
		performance = Performance.query.filter_by(id=perf_id).first_or_404()
		performance.layout = request.json.get("layout")
		performance.seat_assignments = request.json.get("assignments")

		db.session.commit()
		return {
			"code": 200,
			"msg": "Saved!"
		}
	else:
		data = db.session.query(
			func.json_build_object(
				"type", "seating",
				"date", Performance.date,
				"defaultRowCount", Performance.layout["rowCount"],
				"initialHiddenSeats", Performance.layout["hiddenSeats"],
				"initialAssignment", Performance.seat_assignments,
				"showName", Show.title,
				"authors", Show.author
			)
		).filter(
			Performance.id == perf_id
		).join(
			Show, Show.id == Performance.show_id
		).limit(1).scalar()

		if "react" in request.args.keys():
			return jsonify(data)
		else:
			data["initialData"] = True
			return render_template(
				"react_template.html",
				data=data
			)


@bp.post("/members/api/bookings/save_seating/<perf_id>")
def save_seating(perf_id):
	performance = Performance.query.filter_by(id=perf_id).first_or_404()
	performance.layout = request.json.get("layout")
	performance.seat_assignments = request.json.get("assignments")

	db.session.commit()
	return {
		"code": 200,
		"msg": "Saved."
	}


@bp.get("/members/api/orders/<show>/<perf>")
def orders_api(show, perf):
	"""admin"""
	if "auth" in request.args.keys():
		if request.args.get("auth") != KeyValue.query.get("api_key").value:
			abort(401)
	else:
		check_page_permission("bookings")

	perf_tree = collect_orders()
	if "<" in show or "<" in perf:
		abort(404)
	return jsonify(json.loads(json.dumps(list((perf_tree.get(show).get(perf) or {}).values()), default=OrderInfo.default)))

