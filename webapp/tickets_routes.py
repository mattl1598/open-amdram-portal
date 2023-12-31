import json
import re
from io import BytesIO
from pprint import pprint

import xlsxwriter
from flask import Blueprint, make_response, redirect, render_template, request, session, abort, jsonify, url_for
from flask_login import current_user, login_required
# import datetime
from datetime import timedelta, datetime

from sqlalchemy import or_

from webapp.models import *
from flask import current_app as app

bp = Blueprint("tickets_routes", __name__)


def extract_numbers(string):
	# Use regular expression to find all numbers in the string
	numbers = re.findall(r'\d+', string)
	# Convert the first number found to an integer (assuming there's at least one number)
	return "".join(numbers) if numbers else float('inf')


def extract_month(string):
	# Use regular expression to find the month name in the string
	month_match = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b', string, re.IGNORECASE)
	if month_match:
		month_name = month_match.group(0)
		lookup = {
			"Jan": 1, "Feb": 2, "Mar": 3,
			"Apr": 4, "May": 5, "Jun": 6,
			"Jul": 7, "Aug": 8, "Sep": 9,
			"Oct": 10, "Nov": 11, "Dec": 12,
			"January": 1, "February": 2, "March": 3,
			"April": 4, "June": 6, "July": 7,
			"August": 8, "September": 9, "October": 10,
			"November": 11, "December": 12
		}
		# Convert the month name to a numeric value
		month_number = lookup[month_name]
		return month_number
	else:
		# Return a default value for strings with no month information
		return float('inf')


class OrderInfo:
	def __init__(self, id: str, ref: int, date: str, name: str, note: str, ticket_type: str, ticket_quantity: int):
		self.id = id
		self.ref = ref
		self.date = date
		self.name = name
		self.note = note

		self.tickets = {
			ticket_type: int(ticket_quantity)
		}

	def __dict__(self):
		return {
			"ref": self.ref,
			"name": self.name,
			"note": self.note,
			"date": self.date,
			"order_id": self.id,
			"tickets": self.tickets,
			"tickets_count": self.tickets_total()
		}

	def __repr__(self):
		return str(self.__dict__())

	def __str__(self):
		return str(self.__repr__())

	def default(self):
		return self.__dict__()

	def __add__(self, other):
		self.merge(other)
		return self

	def merge(self, new_order) -> None:
		if self.id == new_order.id and self.date == new_order.date:
			if self.note != new_order.note:
				self.note += " " + new_order.note
			for k, v in new_order.tickets.items():
				self.tickets[k] = v + self.tickets.setdefault(k, 0)
		else:
			raise ValueError

	def tickets_total(self) -> int:
		return sum(self.tickets.values())


@bp.route("/test")
def get_ticket_types():
	ticket_types = []
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
		if item["item_data"]["ecom_visibility"] == "VISIBLE":
			ticket_types.append(item["item_data"]["name"])

	perf_tree = {}
	for ticket_type in ticket_types:
		keys = ticket_type.split(" - ", 2)
		if perf_tree.get(keys[0]) is None:
			perf_tree[keys[0]] = {}
		if perf_tree[keys[0]].get(keys[1]) is None:
			perf_tree[keys[0]][keys[1]] = {}

	return perf_tree


def collect_orders():
	now = datetime.now() - timedelta(days=1)
	end_of_last_show = Show.query.filter(Show.date < now).order_by(Show.date.desc()).first().date + timedelta(days=1)

	square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"

	perf_tree = get_ticket_types()

	# pprint(perf_tree)

	results = app.square.orders.search_orders(
		body={
			"location_ids": [
				"0W6A3GAFG53BH"
			],
			"query": {
				"sort": {
					"sort_field": "CREATED_AT",
					"sort_order": "ASC"
				},
				"filter": {
					"date_time_filter": {
						"created_at": {
							"start_at": end_of_last_show.strftime(square_date_format)
						}
					},
					"source_filter": {
						"source_names": [
							"Square Online"
						]
					},
					"state_filter": {
						"states": [
							"OPEN",
							"COMPLETED"
						]
					},
					"fulfillment_filter": {
						"fulfillment_types": [
							"PICKUP"
						]
					}
				}
			}
		}
	)

	if results.is_error():
		print("Error:", results.errors)
		abort(500)
	else:
		items = []
		mods = (BookingModifications
					.query
					.filter(
						BookingModifications.ref_num < 0,
						BookingModifications.datetime > end_of_last_show
					)
				.all()
				or [])
		for mod in mods:
			tickets_info = {
				"ticket_type": mod.to_item,
				"ticket_quantity": mod.change_quantity,
				"name": mod.from_item,
				"note": ["Comped - ", "Reserved - "][int(mod.is_reservation)] + (mod.note or ""),
				"date": datetime.utcnow().strftime(square_date_format)[:-4] + "Z",
				"id": mod.id,
				"ref": mod.ref_num
			}
			order_info = OrderInfo(**tickets_info)
			items.append(order_info)
		for i in range(0, len(results.body.get("orders") or [])):
			order = results.body["orders"][i]
			mods = (BookingModifications
						.query
						.filter_by(ref_num=i)
						.filter(
							BookingModifications.datetime > end_of_last_show,
							or_(BookingModifications.from_item == "", BookingModifications.from_item.is_(None))
						)
					.all()
					or [])
			for mod in mods:
				tickets_info = {
					"ticket_type": mod.to_item,
					"ticket_quantity": mod.change_quantity,
					"name": order["fulfillments"][0]["pickup_details"]["recipient"]["display_name"],
					"note": " ".join([order["fulfillments"][0]["pickup_details"]["note"], mod.note or ""]),
					"date": order["fulfillments"][0]["pickup_details"]["placed_at"],
					"id": order["id"],
					"ref": i
				}
				order_info = OrderInfo(**tickets_info)
				items.append(order_info)
			for item in order["line_items"]:
				try:
					if len((mods := BookingModifications
										.query
										.filter_by(ref_num=i, from_item=item["name"])
										.filter(BookingModifications.datetime > end_of_last_show)
										.all()
								or []
							)):
						remaining_quantity = int(item["quantity"])
						for mod_num in range(0, len(mods) + 1):
							if mod_num >= len(mods):
								to_item = item["name"]
								quantity = remaining_quantity
							else:
								to_item = mods[mod_num].to_item
								if mods[mod_num].change_quantity > remaining_quantity:
									abort(500,
											f"Quantity in modification is too large for assigned order. Ref: {i}. Mod ID: {mods[mod_num].id}."
									)
								remaining_quantity = remaining_quantity - (quantity := mods[mod_num].change_quantity)

							if quantity != 0:
								tickets_info = {
									"ticket_type": to_item,
									"ticket_quantity": quantity,
									"name": order["fulfillments"][0]["pickup_details"]["recipient"]["display_name"],
									"note": " ".join(
										[order["fulfillments"][0]["pickup_details"]["note"], mods[mod_num].note or ""]),
									"date": order["fulfillments"][0]["pickup_details"]["placed_at"],
									"id": order["id"],
									"ref": i
								}
								order_info = OrderInfo(**tickets_info)
								items.append(order_info)
					else:
						tickets_info = {
							"ticket_type": item["name"],
							"ticket_quantity": item["quantity"],
							"name": order["fulfillments"][0]["pickup_details"]["recipient"]["display_name"],
							"note": order["fulfillments"][0]["pickup_details"]["note"],
							"date": order["fulfillments"][0]["pickup_details"]["placed_at"],
							"id": order["id"],
							"ref": i
						}
						order_info = OrderInfo(**tickets_info)
						items.append(order_info)
				except KeyError as e:
					pass

		for item in items:
			keys = list(item.tickets.keys())[0].split(" - ", 2)
			item.tickets[keys[2]] = item.tickets.pop(list(item.tickets.keys())[0])
			if (existing := perf_tree[keys[0]][keys[1]].get(item.id)) is not None:
				perf_tree[keys[0]][keys[1]][item.id] = existing + item
			else:
				perf_tree[keys[0]][keys[1]][item.id] = item

	return perf_tree


@bp.get("/members/api/orders/<show>/<perf>")
def orders_api(show, perf):
	"""admin"""
	if (current_user.is_authenticated and (current_user.role in ["admin"])) or request.args.get("auth") == KeyValue.query.get("api_key"):
		perf_tree = collect_orders()
		if "<" in show or "<" in perf:
			abort(404)
		return jsonify(json.loads(json.dumps(list(perf_tree.get(show).get(perf).values()), default=OrderInfo.default)))
	else:
		abort(401)


@bp.get('/members/get_orders')
@login_required
def get_orders():
	"""admin"""
	if current_user.role not in ["admin"]:
		abort(403)

	else:
		perf_tree = collect_orders()

		output = BytesIO()
		workbook = xlsxwriter.Workbook(output)

		for perf in perf_tree.keys():
			orders = perf_tree.get(perf)
			for x, y in orders.items():
				row = 1
				date_string = x.replace("st", "").replace("nd", "").replace("rd", "").replace("th", "")
				date_string = date_string\
					.replace(" 1:", " 01:").replace(" 2:", " 02:").replace(" 3:", " 03:").replace(" 4:", " 04:")\
					.replace(" 5:", " 05:").replace(" 6:", " 06:").replace(" 7:", " 07:").replace(" 8:", " 08:")\
					.replace(" 9:", " 09:").replace("am", "AM").replace("pm", "PM")
				date_string = date_string\
					.replace(" 1 ", " 01 ").replace(" 2 ", " 02 ").replace(" 3 ", " 03 ").replace(" 4 ", " 04 ")\
					.replace(" 5 ", " 05 ").replace(" 6 ", " 06 ").replace(" 7 ", " 07 ").replace(" 8 ", " 08 ")\
					.replace(" 9 ", " 09 ") + f" {datetime.now().year}"
				dt = datetime.strptime(date_string, "%a %d %B %I:%M%p %Y")

				worksheet_name = f"{''.join([i[0] for i in perf.split(' ')])} - {dt.strftime('%a %d %b %I.%M%p')}"
				worksheet = workbook.add_worksheet(name=worksheet_name)
				worksheet.write("A1", f"{perf} - {x}")

				worksheet.write(row, 0, "Date")
				worksheet.write(row, 1, "Ref #")
				worksheet.write(row, 2, "Name")
				worksheet.write(row, 3, "Adults")
				worksheet.write(row, 4, "Juniors")
				worksheet.write(row, 5, "Total")
				worksheet.write(row, 6, "Note")
				row += 1

				for order in y.values():
					worksheet.write(row, 0, order.date)
					worksheet.write(row, 1, order.ref)
					worksheet.write(row, 2, order.name)
					worksheet.write(row, 3, order.tickets.get("Adult") or 0)
					worksheet.write(row, 4, order.tickets.get("Junior") or 0)
					worksheet.write(row, 5, order.tickets_total())
					worksheet.write(row, 6, order.note)
					row += 1

				worksheet.write_formula("D1", f'=SUM(D3:D{row})')
				worksheet.write_formula("E1", f'=SUM(E3:E{row})')
				worksheet.write_formula("F1", f'=SUM(F3:F{row})')
				worksheet.autofit()

		workbook.close()
		output.seek(0)
		response = make_response(output.getvalue())
		response.headers["Content-Disposition"] = f'attachment; filename="orders {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}.xlsx"'
		response.headers["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		output.close()

		return response


@bp.route("/members/bookings", methods=["GET", "POST"])
@login_required
def bookings():
	"""admin"""
	if current_user.role not in ["admin"]:
		abort(403)
	if request.method == "POST":
		new_mod = BookingModifications(
			id=BookingModifications.get_new_id(),
			datetime=datetime.utcnow(),
			ref_num=request.form.get("ref_num"),
			from_item=request.form.get("from_item"),
			change_quantity=request.form.get("change_quantity"),
			to_item=request.form.get("to_item"),
			is_reservation=request.form.get("is_reservation"),
			note=request.form.get("note")
		)
		db.session.add(new_mod)
		db.session.commit()
		return redirect(url_for('tickets_routes.bookings'))
	if request.args.get("delete"):
		mod = BookingModifications.query.filter_by(id=request.args.get("delete")).all()
		if len(mod):
			db.session.delete(mod[0])
			db.session.commit()
		return redirect(url_for("tickets_routes.bookings"))
	now = datetime.utcnow() - timedelta(days=1)
	end_of_last_show = Show.query.filter(Show.date < now).order_by(Show.date.desc()).first().date + timedelta(days=1)
	mods = BookingModifications.query.filter(BookingModifications.datetime > end_of_last_show).all()
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

	return render_template(
			"members/manage_bookings.html",
			mods=mods,
			items=items,
			css="bookings.css"
		)


@bp.route("/members/bookings/historic_sales")
@login_required
def historic_sales():
	"""admin"""
	if current_user.role not in ["admin"]:
		abort(403)
	show_id = request.args.get("show_id")
	data = None
	totals = None
	errors = 0
	if show_id is not None:
		square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
		show = Show.query.get(show_id)
		end_date = show.date
		start_date = Show.query.filter(Show.date < end_date).order_by(Show.date.desc()).first().date + timedelta(days=1)

		results = app.square.orders.search_orders(
			body={
				"location_ids": [
					"0W6A3GAFG53BH"
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
						"source_filter": {
							"source_names": [
								"Square Online"
							]
						},
						"state_filter": {
							"states": [
								"OPEN",
								"COMPLETED"
							]
						},
						"fulfillment_filter": {
							"fulfillment_types": [
								"PICKUP"
							]
						}
					}
				}
			}
		)
		sums = {}
		payment_ids = []
		if results.is_error():
			print("Error:", results.errors)
			abort(500)
		else:
			flag = True
			for order in (results.body.get("orders") or []):
				for item in order["line_items"]:
					sums[item["name"]] = (sums.get(item["name"]) or 0) + int(item["quantity"])
				try:
					for tender in order["tenders"]:
						payment_ids.append(tender["id"])
				except KeyError as e:
					print("KeyError:", e)
					pprint(order)

		payments = []
		flag = True
		cursor = ""
		while flag:
			if cursor:
				result = app.square.payments.list_payments(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
					location_id="0W6A3GAFG53BH",
					cursor=cursor
				)
			else:
				result = app.square.payments.list_payments(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
					location_id="0W6A3GAFG53BH"
				)
			if result.is_error():
				print(result.errors)
				errors += 1
				flag = False
			else:
				payments += list(result.body.get("payments"))
				if not (cursor := result.body.get("cursor")):
					flag = False

		totals = {
			"paid": 0,
			"fees": 0,
			"net": 0
		}
		for payment in payments:
			if payment["id"] in payment_ids:
				if payment["status"] == "COMPLETED":
					try:
						totals["paid"] += int(payment["amount_money"]["amount"])
						totals["net"] += int(payment["amount_money"]["amount"])
						totals["fees"] += int(sum([i["amount_money"]["amount"] for i in payment["processing_fee"]]))
						totals["net"] -= int(sum([i["amount_money"]["amount"] for i in payment["processing_fee"]]))

					except KeyError as e:
						errors += 1
						pprint(payment)
						print(e)
				else:
					print(payment["status"])

		data = sorted(list(sums.items()), key=lambda tup: extract_numbers(tup[0]))
		print([extract_numbers(i[0]) for i in data])
		data = sorted(data, key=lambda tup: extract_month(tup[0]))

	return render_template(
		"members/historic_sales.html",
		data=data,
		totals=totals,
		id=show_id,
		errors=errors,
		shows=Show.query.order_by(Show.date.desc()).all(),
		css="bookings.css"
	)
