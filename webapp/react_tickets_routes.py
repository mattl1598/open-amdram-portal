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

	mods = db.session.query(
		func.coalesce(func.json_agg(
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
		), '[]')
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
		func.coalesce(func.json_agg(
			func.json_build_object(
				"id", text("results.id"),
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
		).order_by(
			Performance.date.asc()
		).filter(
			Performance.date > datetime.utcnow()
		).subquery().alias("results")
	).scalar()

	past_shows = db.session.query(
		func.coalesce(func.json_agg(
			func.json_build_object(
				"id", text("results.id"),
				"title", text("results.title"),
				"date", text("results.date")
			)
		), '[]')
	).select_from(db.session.query(
		Show.id, Show.title, Show.date
	).order_by(Show.date.desc()).subquery().alias("results")).scalar()

	# performances = Performance.query.filter(Performance.date > end_of_last_show).order_by(Performance.date.asc()).all()
	data = {
		"type": "bookings",
		"title": "Manage Bookings",
		"mods": mods,
		"performances": performances,
		"items": items,
		"past_shows": past_shows
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


@bp.route("/members/api/bookings/add_booking_mod", methods=["POST"])
def add_booking_mod():
	new_mod = BookingModifications(
		id=BookingModifications.get_new_id(),
		datetime=datetime.utcnow(),
		ref_num=int(request.form.get("ref_num")),
		from_item=request.form.get("from_item"),
		change_quantity=int(request.form.get("change_quantity")),
		to_item=request.form.get("to_item"),
		is_reservation=(request.form.get("is_reservation") == 'on'),
		note=request.form.get("note")
	)
	db.session.add(new_mod)
	db.session.commit()
	return {
		"code": 200,
		"msg": "Added new booking modification"
	}


@bp.post("/members/api/bookings/delete_booking_mod")
def delete_booking_mod():
	mod_id = request.json.get("id")
	if not mod_id:
		return {
			"code": 400,
			"msg": "Booking modification ID is required."
		}

	booking_mod = db.session.query(BookingModifications).filter_by(id=mod_id).first()
	if not booking_mod:
		return {
			"code": 404,
			"msg": "Booking modification not found."
		}

	db.session.delete(booking_mod)
	db.session.commit()
	return {
		"code": 200,
		"msg": "Booking modification deleted successfully."
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

	show_title = show

	show_id = db.session.query(
		Show.id, Show.date
	).filter(
		Show.title == show_title
	).order_by(
		Show.date.desc()
	).first().id

	perf_tree = collect_orders(show_id=show_id)
	if "<" in show or "<" in perf:
		abort(404)
	return jsonify(json.loads(json.dumps(list((perf_tree.get(show.replace("`", "'")).get(perf) or {}).values()), default=OrderInfo.default)))


@bp.get("/members/api/historic_sales/<show_id>")
def historic_sales_api(show_id):
	check_page_permission("bookings")
	square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
	show = db.session.query(Show).filter(Show.id == show_id).first()
	if show is None:
		return {
			"code": 404,
			"msg": "Show not found"
		}

	perf_tree = collect_orders(show_id=show_id)
	ref_map = {}
	for perfs in perf_tree.values():
		for perf, orders in perfs.items():
			for order_id, details in orders.items():
				ref_map[order_id] = details.ref

	if (end_date := show.date + timedelta(days=14)) > datetime.utcnow():
		end_date = datetime.utcnow()
	start_date = Show.query.filter(Show.date < show.date).order_by(Show.date.desc()).first().date + timedelta(days=2)

	print(end_date)
	print(start_date.strftime("%Y-%m-%dT%H:%M:%S"))
	results = app.square.orders.search_orders(
		body={
			"location_ids": [
				"0W6A3GAFG53BH",
				"M1D6QJY6BHW9R"
			],
			"query": {
				"sort": {
					"sort_field": "CREATED_AT",
					"sort_order": "ASC"
				},
				"filter": {
					"date_time_filter": {
						"created_at": {
							"start_at": start_date.strftime(square_date_format),
							"end_at": end_date.strftime(square_date_format)
						}
					},
					"state_filter": {
						"states": [
							"OPEN",
							"COMPLETED"
						]
					}
				}
			}
		}
	)
	if results.is_error():
		# print("Error:", results.errors)
		return {
			"code": 500,
			"msg": "Square API error (Orders)."
		}

	sums = {}
	payment_ids = set()
	refunds = []
	at_door_orders = []
	expected_refunds = 0
	foh_payment_ids = set()

	mods_db = db.session.query(
		BookingModifications.ref_num, func.json_agg(func.json_build_object(
			"id", BookingModifications.id,
			"ref_num", BookingModifications.ref_num,
			"from_item", BookingModifications.from_item,
			"change_quantity", BookingModifications.change_quantity,
			"to_item", BookingModifications.to_item,
			"is_reservation", BookingModifications.is_reservation,
			"mark_as_paid", BookingModifications.mark_as_paid,
		))
	).filter(
		BookingModifications.datetime > start_date,
		BookingModifications.datetime < end_date,
	).group_by(BookingModifications.ref_num).all()

	foh_totals = {
		"paid": 0,
		"cash": 0,
		"fees": 0,
		"net": 0
	}

	mods = {}
	for mod_db in mods_db:
		mods[mod_db[0]] = mod_db[1]
	for order in results.body.get("orders", []):
		if "returned_quantities" in order.keys():
			for refund in order["returned_quantities"]:
				refunds.append((refund.get("refunded_money") or {}).get("amount"))
		if order.get("state") in ["OPEN"]:
			valid_payment = True
		else:
			valid_payment = True
		try:
			if order.get("total_money", {}).get("amount", 0) > 0 and order.get("tenders"):
				for tender in order["tenders"]:
					if not ((tender.get("card_details") or {}).get("status") == "CAPTURED"):
						valid_payment = False
			else:
				valid_payment = False
		except KeyError as e:
			print("KeyError:", e)
			# pprint(order)
		if valid_payment:
			# print(order["id"])
			valid_order = True
			foh_order = False
			is_cash = False
			item_sums = {}
			item_refunds = []
			for item in order["line_items"]:
				item_name = item.get("name") or ""
				if item_name and show.title.replace("`", "'") in item_name:
					if "returned_quantities" in item.keys():
						for refund in item["returned_quantities"]:
							item_refunds.append((refund.get("refunded_money") or {}).get("amount"))
					base_price = item.get("base_price_money", {}).get("amount", 0)
					item_sum = item_sums.get(item["name"], {}).get(base_price, {"amount": 0, "discounts": 0})
					item_sum["amount"] += int(item["quantity"])
					if item_sums.get(item["name"]) is None:
						item_sums[item["name"]] = {}
					if "applied_discounts" in item.keys():
						total_discount = 0
						for discount in item["applied_discounts"]:
							total_discount += discount.get("applied_money", {}).get("amount", 0)
						item_sum["discounts"] += total_discount
					item_sums[item["name"]][base_price] = item_sum
				elif "Membership" not in item_name and order.get("location_id"):
					foh_order = True
					valid_order = False
				else:
					valid_order = False

			if valid_order:
				for tender in order["tenders"]:
					payment_ids.add(tender["id"])
				order_ref = ref_map.get(order.get("id"))
				if order_ref is None:
					at_door_orders.append(order)
				else:
					if (mod_list := mods.get(order_ref)) is not None:
						for mod in mod_list:
							# if mod.to_item and mod.from_item and mod.from_item != mod.to_item:
							# 		if mod.from_item.split(" - ", 2)[-1] == "Adult" and mod.to_item.split(" - ", 2)[-1] == "Junior":
							# 			# change from adult to junior with partial refund
							# 			from_value = {"Adult": 1200, "Junior": 1000, "Free": 0}.get(
							# 				mod.from_item.split(" - ")[-1]) * mod.change_quantity
							# 			to_value = {"Adult": 1200, "Junior": 1000, "Free": 0}.get(
							# 				mod.to_item.split(" - ")[-1]) * mod.change_quantity
							# 			expected_refunds += from_value - to_value
							if mod.get("ref_num") >= 0 and mod.get("from_item") and mod.get("change_quantity") > 0:
								# change performance
								price, from_dict = list(item_sums[mod.get("from_item")].items())[0]

								move_me = {
									"amount": mod.get("change_quantity"),
									"discounts": from_dict.get("discounts") * mod.get("change_quantity")/from_dict.get("amount")
								}
								for k, v in move_me.items():
									item_sums[mod.get("from_item")][price][k] = from_dict[k] - v
									item_sums[mod.get("to_item")] = item_sums.get(mod.get("to_item"), {})
									item_sums[mod.get("to_item")][price] = item_sums[mod.get("to_item")].get(price, {})
									item_sums[mod.get("to_item")].get(price, {})[k] = v + item_sums.get(mod.get("to_item"), {}).get(price, {}).get(k, 0)

							elif mod.get("ref_num") >= 0 and not mod.get("from_item") and mod.get("change_quantity") > 0:
								# adding free ticket to existing order
								if not mod.get("mark_as_paid"):
									item_name = " - ".join([*mod.to_item.split(" - ", 2)[:-1], "Free"])
									if item_sums.get(item_name) and item_sums.get(item_name).get(0):
										for k, v in {"amount": mod.get("change_quantity", 0), "discounts": 0}.items():
											item_sums[item_name][0][k] = item_sums[item_name][0][k] + v
									elif item_sums.get(item_name):
										item_sums[item_name][0] = {"amount": mod.get("change_quantity", 0), "discounts": 0}
									else:
										item_sums[item_name] = {0: {"amount": mod.get("change_quantity", 0), "discounts": 0}}
							elif mod.get("change_quantity") < 0 and (mod.get("from_item") == mod.get("to_item") or not mod.get("from_item")):
								# full ticket refund
								if mod.get("from_item") == mod.get("to_item"):
									# option for changing paid ticket to free one.
									item_name = " - ".join([*mod.to_item.split(" - ", 2)[:-1], "Free"])
									if item_sums.get(item_name) and item_sums.get(item_name).get(0):
										for k, v in {"amount": mod.get("change_quantity", 0), "discounts": 0}.items():
											item_sums[item_name][0][k] = item_sums[item_name][0][k] + v
									elif item_sums.get(item_name):
										item_sums[item_name][0] = {"amount": mod.get("change_quantity", 0), "discounts": 0}
									else:
										item_sums[item_name] = {0: {"amount": mod.get("change_quantity", 0), "discounts": 0}}

								price, from_dict = list(item_sums[mod.get("to_item")].items())[0]
								refund_me = {
									"amount": mod.get("change_quantity"),
									"discounts": from_dict.get("discounts") * mod.get(
										"change_quantity") / from_dict.get("amount")
								}
								for k, v in refund_me.items():
									# item_sums[mod.get("to_item")][price][k] = from_dict[k] - v
									item_sums[mod.get("to_item")] = item_sums.get(mod.get("to_item"), {})
									item_sums[mod.get("to_item")][price] = item_sums[mod.get("to_item")].get(price, {})
									item_sums[mod.get("to_item")].get(price, {})[k] = v + item_sums.get(mod.get("to_item"), {}).get(price, {}).get(k, 0)
								expected_refunds += price * abs(mod.get("change_quantity"))

				# pprint(item_sums)
				refunds += item_refunds
				for k, v in item_sums.items():
					if sums.get(k):
						for key, value in v.items():
							for key2, value2 in value.items():
								sums[k][key][key2] = sums[k][key][key2] + value2
					else:
						sums[k] = v

			if foh_order:
				if not is_cash:
					for tender in order["tenders"]:
						foh_payment_ids.add(tender["id"])
				else:
					for tender in order["tenders"]:
						if tender.get("status") == "COMPLETED":
							foh_totals["cash"] += int(tender["amount_money"]["amount"])

	for ref, mod_list in mods.items():
		for mod in mod_list:
			if ref < 0:
				# free ticket(s) with no existing Square order
				if not mod.get("mark_as_paid"):
					item_name = " - ".join([*mod.get("to_item").split(" - ", 2)[:-1], "Free"])

					for k, v in {"amount": mod.get("change_quantity"), "discounts": 0}.items():
						sums[item_name] = sums.get(item_name, {})
						sums[item_name][0] = sums[item_name].get(0, {})
						sums[item_name].get(0, {})[k] = v + sums.get(item_name, {}).get(0, {}).get(k, 0)

	# data = None
	# totals = None
	# pos_sums = {}

	errors = 0
	payments = []
	for location in ["0W6A3GAFG53BH", "M1D6QJY6BHW9R"]:
		flag = True
		cursor = ""
		while flag:
			if cursor:
				result = app.square.payments.list_payments(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
					location_id=location,
					cursor=cursor
				)
			else:
				result = app.square.payments.list_payments(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
					location_id=location
				)
			if result.is_error():
				# print(result.errors)
				errors += 1
				flag = False
			else:
				payments += list(result.body.get("payments") or [])
				if not (cursor := result.body.get("cursor")):
					flag = False

	totals = {
		"paid": 0,
		"cash": 0,
		"fees": 0,
		"expected_refunds": expected_refunds,
		"actual_refunds": sum(refunds),
		"net": 0
	}

	other_sum = 0
	# point_of_sale_order_ids = [*pos_card_orders]
	point_of_sale_order_ids = {}
	# print(point_of_sale_order_ids)
	for payment in payments:
		if payment["id"] in payment_ids:
			# print(payment["id"])
			if payment["status"] == "COMPLETED":
				try:
					totals["paid"] += int(payment["amount_money"]["amount"])
					totals["fees"] += int(sum([i["amount_money"]["amount"] for i in payment["processing_fee"]]))
				except KeyError as e:
					errors += 1
					# pprint(payment)
					print(e)
			else:
				# print(payment["status"])
				pass
		elif payment["id"] in foh_payment_ids:
			if payment["status"] == "COMPLETED" and payment["application_details"] == {
				'square_product': 'SQUARE_POS'
			} and payment["amount_money"]["amount"] > 0:
				try:
					if payment.get("source_type") == "CARD":
						foh_totals["paid"] += int(payment["amount_money"]["amount"])
						foh_totals["fees"] += int(
							sum([i["amount_money"]["amount"] for i in payment.get("processing_fee", [])]))
					else:
						foh_totals["cash"] += int(payment["amount_money"]["amount"])
					point_of_sale_order_ids.append(payment.get("order_id"))
				except KeyError as e:
					errors += 1
					# pprint(payment)
					print(e)
			elif payment["status"] == "COMPLETED" and payment["amount_money"]["amount"] > 0:
				# print(payment["id"])
				# other_ids.append(payment.get("order_id"))
				other_sum += payment["amount_money"]["amount"]
		else:
			point_of_sale_order_ids[payment.get("order_id")] = payment
			pprint(payment)
			# TODO: check if payment is FOH using batch retrieve orders.

	print("other sum", other_sum)

	print("SUMS:")
	pprint(sums)
	print("REFUNDS:")
	pprint(refunds)
	print("EXPECTED REFUNDS:")
	pprint(expected_refunds)
	print("TOTALS:")
	pprint(totals)
	print("FOH TOTALS:")
	pprint(foh_totals)

	return {
		"code": 200,
		"msg": "Success"
	}
