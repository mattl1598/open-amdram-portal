import json
import re
from pprint import pprint
import hashlib

from flask import Blueprint, make_response, redirect, render_template, request, session, abort, jsonify, url_for
from flask_login import current_user, login_required
from datetime import timedelta, datetime

from jinja2.lexer import TOKEN_DOT
from sqlalchemy import case, func, or_, select, text
from webapp.models import *
from flask import current_app as app

from webapp.react_permissions import check_page_permission
from webapp.tickets_routes import collect_orders, get_ticket_types, OrderInfo

bp = Blueprint("react_store_routes", __name__)


def datetime_formatter(date):
    dt = datetime.fromisoformat(date) if isinstance(date, str) else date

    day = ["Mon", "Tues", "Weds", "Thurs", "Fri", "Sat", "Sun"][dt.weekday()]
    month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.month - 1]

    def ord_suffix(n):
        if 10 < n % 100 < 21:
            return "th"
        return {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")

    ampm = "pm" if dt.hour >= 12 else "am"
    hour = dt.hour % 12 or 12

    return f"{day} {dt.day}{ord_suffix(dt.day)} {month} {hour}:{dt.minute}{ampm}"


@bp.get("/tickets/stock")
def tickets_stock():
	now = datetime.utcnow()
	show = Show.query.filter(Show.date < now).order_by(Show.date.desc()).first()
	end_of_last_show = show.date + timedelta(days=1)
	next_show = Show.query.filter(Show.date > now).order_by(Show.date.asc()).first()

	raw_performances = db.session.query(
		func.coalesce(func.json_agg(
			func.json_build_object(
				"id", text("results.id"),
				"title", text("results.title"),
				"image", text("results.image"),
				"date", text("results.date"),
				"layout", text("results.layout"),
				"seat_assignments", text("results.seat_assignments")
			)
		), '[]')
	).select_from(
		db.session.query(
			Performance.id.label("id"),
			Performance.date.label("date"),
			Performance.layout.label("layout"),
			Performance.seat_assignments.label("seat_assignments"),
			Show.ticket_image.label("image"),
			Show.title.label("title")
		).order_by(
			Performance.date.asc()
		).filter(
			Performance.show_id == next_show.id
		).join(
			Show, Performance.show_id == Show.id
		).subquery().alias("results")
	).scalar()

	performances = {}

	for performance in raw_performances:
		performances[performance["id"]] = performance
		performances[performance["id"]]["pricing"] = {
			"Adult": 1200,
			"Child": 1000
		}

	return {
		"performances": performances
	}


@bp.get("/tickets/checkout")
def ticket_checkout():
	data = {
		'type': 'ticket_checkout'
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/tickets/checkout/payment")
def checkout_payment():
	performances = tickets_stock()["performances"]
	line_items = []
	total = 0

	for perfID, items in request.json.get("items", {}).items():
		title = performances[perfID].get('title', '')
		date = datetime_formatter(datetime.fromisoformat(performances[perfID].get('date', '')))
		for item, qty in items["tickets"].items():
			amount = performances[perfID]["pricing"][item]
			# amount = 0
			total += qty * amount
			line_item = {
				"quantity": str(qty),
				"base_price_money": {
					"amount": amount,
					"currency": "GBP"
				},
				"name": f"{title} - {date} - {item}",
			}
			line_items.append(line_item)

	# line_items.append({
	# 	"quantity": "1",
	# 	"base_price_money": {
	# 		"amount": 0,
	# 		"currency": "GBP",
	# 	},
	# 	"name": "Digital Ticket",
	# 	"note": ""
	# })
			
	new_order = {
		"location_id": app.envs.square_webstore_location,
		"source": {"name": "SP Webstore"},
		"line_items": line_items,
		"state": "OPEN",
		"fulfillments": [
			{
				"type": "PICKUP",
				"state": "PROPOSED",
				"pickup_details": {
					"schedule_type": "ASAP",
					"note": request.json.get("form", {}).get("notes", ""),
					"recipient": {
						"display_name": request.json.get("form", {}).get("name", ""),
						"email_address": request.json.get("form", {}).get("email", ""),
						"phone_number": request.json.get("form", {}).get("phone", "")
					}
				}
			}
		]
	}

	current_date = datetime.utcnow().strftime("%Y-%m-%d")
	idempotency_source = json.dumps(new_order, sort_keys=True) + current_date
	idempotency_key = hashlib.sha256(idempotency_source.encode()).hexdigest()

	new_order_result = app.square_new.orders.create(
		idempotency_key=idempotency_key,
		order=new_order
	)

	if total:
		try:
			payment_result = app.square_new.payments.create(
				idempotency_key=hashlib.sha256(request.json.get("form", {}).get("payment_token", "").encode()).hexdigest()[:45],
				amount_money=new_order_result.order.total_money,
				autocomplete=True,
				source_id=request.json.get("form", {}).get("payment_token", ""),
				# verification_token=request.json.get("form", {}).get("verf_token", ""),
				order_id=new_order_result.order.id,
				location_id=app.envs.square_webstore_location
			)
		except Exception as e:
			return {
				"code": 400,
				"status": "FAILURE",
				"msg": e.body.get("errors")[0].get("detail"),
			}
	else:
		payment_result = app.square_new.payments.create(
			idempotency_key=hashlib.sha256(str(datetime.utcnow()).encode()).hexdigest()[:45],
			source_id="CASH",
			cash_details={
				"buyer_supplied_money": new_order_result.order.total_money
			},
			amount_money=new_order_result.order.total_money,
			autocomplete=True,
			order_id=new_order_result.order.id,
			location_id=app.envs.square_webstore_location
		)

	return {
		"code": 200,
		"status": "success",
		"msg": "Payment successful",
		"receipt_id": payment_result.payment.id
	}


@bp.get("/tickets/checkout/success")
def ticket_checkout_success():
	data = {
		'type': 'ticket_success'
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)
