import json
import re
from io import BytesIO

import dateutil
import requests
from pprint import pprint
from dateutil import parser

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
		# print(item["item_data"]["ecom_visibility"], "-", item["item_data"]["name"])
		if item["item_data"]["ecom_visibility"] in ["VISIBLE", "HIDDEN"]:
			ticket_types.append(item["item_data"]["name"])

	perf_tree = {}
	print(ticket_types)
	for ticket_type in ticket_types:
		if ticket_type.count("-") == 2:
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
								if mod_num >= len(mods):
									note = ""
								else:
									note = mods[mod_num].note
								tickets_info = {
									"ticket_type": to_item,
									"ticket_quantity": quantity,
									"name": order["fulfillments"][0]["pickup_details"]["recipient"]["display_name"],
									"note": " ".join(
										[order["fulfillments"][0]["pickup_details"]["note"], note or ""]),
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
	if request.args.get("auth") == KeyValue.query.get("api_key").value or (current_user.is_authenticated and (current_user.role in ["admin"])):
		perf_tree = collect_orders()
		if "<" in show or "<" in perf:
			abort(404)
		return jsonify(json.loads(json.dumps(list((perf_tree.get(show).get(perf) or {}).values()), default=OrderInfo.default)))
	elif current_user.is_authenticated:
		abort(403)
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
			ref_num=int(request.form.get("ref_num")),
			from_item=request.form.get("from_item"),
			change_quantity=int(request.form.get("change_quantity")),
			to_item=request.form.get("to_item"),
			is_reservation=(request.form.get("is_reservation") == 'on'),
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

	performances = Performance.query.filter(Performance.date > end_of_last_show).order_by(Performance.date.asc()).all()

	return render_template(
			"members/manage_bookings.html",
			mods=mods,
			performances=performances,
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
	pos_sums = {}
	errors = 0
	if show_id is not None:
		square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
		show = Show.query.get(show_id)
		if (end_date := show.date + timedelta(days=2)) > datetime.utcnow():
			end_date = show.date
		# end_date = show.date
		# print(end_date)
		start_date = Show.query.filter(Show.date < show.date).order_by(Show.date.desc()).first().date + timedelta(days=2)
		# print(start_date.strftime("%Y-%m-%dT%H:%M:%S"))

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
		refund_sums = {}
		payment_ids = []
		refunds = []
		if results.is_error():
			# print("Error:", results.errors)
			abort(500)
		else:
			for order in (results.body.get("orders") or []):
				if "returned_quantities" in order.keys():
					for refund in order["returned_quantities"]:
						refunds.append((refund.get("refunded_money") or {}).get("amount"))
				valid_payment = True
				try:
					for tender in order["tenders"]:
						if (tender.get("card_details") or {}).get("status") == "CAPTURED":
							payment_ids.append(tender["id"])
						else:
							valid_payment = False
				except KeyError as e:
					print("KeyError:", e)
					# pprint(order)
				if valid_payment:
					# print(order["id"])
					for item in order["line_items"]:
						if "returned_quantities" in item.keys():
							# print(order["id"])
							for refund in item["returned_quantities"]:
								refunds.append((refund.get("refunded_money") or {}).get("amount"))
						sums[item["name"]] = (sums.get(item["name"]) or 0) + int(item["quantity"])


		mods = BookingModifications.query.filter(
			end_date > BookingModifications.datetime,
			BookingModifications.datetime > start_date
		).all() or []

		expected_refunds = 0

		for mod in mods:
			if mod.to_item and mod.from_item and mod.from_item != mod.to_item:
				if mod.from_item.split(" - ", 2)[-1] == "Adult" and mod.to_item.split(" - ", 2)[-1] == "Junior":
					# change from adult to junior with partial refund
					from_value = {"Adult": 1000, "Junior": 800, "Free": 0}.get(mod.from_item.split(" - ")[-1]) * mod.change_quantity
					to_value = {"Adult": 1000, "Junior": 800, "Free": 0}.get(mod.to_item.split(" - ")[-1]) * mod.change_quantity
					expected_refunds += from_value - to_value
			if mod.ref_num >= 0 and mod.from_item and mod.change_quantity > 0:
				# change performance
				sums[mod.from_item] = (sums.get(mod.from_item) or 0) - int(mod.change_quantity)
				sums[mod.to_item] = (sums.get(mod.to_item) or 0) + int(mod.change_quantity)
			elif mod.ref_num >= 0 and not mod.from_item and mod.change_quantity > 0:
				# adding free ticket to existing order
				item_name = " - ".join([*mod.to_item.split(" - ", 2)[:-1], "Free"])
				sums[item_name] = (sums.get(item_name) or 0) + int(mod.change_quantity)
			elif mod.ref_num < 0:
				# free ticket(s) with no existing Square order
				item_name = " - ".join([*mod.to_item.split(" - ", 2)[:-1], "Free"])
				sums[item_name] = (sums.get(item_name) or 0) + int(mod.change_quantity)
			elif mod.change_quantity < 0 and (mod.from_item == mod.to_item or not mod.from_item):
				# full ticket refund
				if mod.from_item == mod.to_item:
					# option for changing paid ticket to free one.
					item_name = " - ".join([*mod.to_item.split(" - ", 2)[:-1], "Free"])
					sums[item_name] = (sums.get(item_name) or 0) + abs(int(mod.change_quantity))
				sums[mod.to_item] = (sums.get(mod.to_item) or 0) + int(mod.change_quantity)
				expected_refunds += {"Adult": 1000, "Junior": 800, "Free": 0}.get(mod.to_item.split(" - ")[-1]) * abs(mod.change_quantity)

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
				payments += list(result.body.get("payments") or [])
				if not (cursor := result.body.get("cursor")):
					flag = False

		totals = {
			"paid": 0,
			"fees": 0,
			"expected_refunds": expected_refunds,
			"actual_refunds": sum(refunds),
			"net": 0
		}
		# print("PAYMENTS")
		other_sum = 0
		point_of_sale_order_ids = []
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
			else:
				if payment["status"] == "COMPLETED" and payment["application_details"] == {'square_product': 'SQUARE_POS'} and payment["amount_money"]["amount"] > 0:
					try:
						totals["paid"] += int(payment["amount_money"]["amount"])
						totals["fees"] += int(sum([i["amount_money"]["amount"] for i in payment["processing_fee"]]))
						point_of_sale_order_ids.append(payment.get("order_id"))
					except KeyError as e:
						errors += 1
						# pprint(payment)
						print(e)
				elif payment["status"] == "COMPLETED" and payment["amount_money"]["amount"] > 0:
					# print(payment["id"])
					# other_ids.append(payment.get("order_id"))
					other_sum += payment["amount_money"]["amount"]
		# print("other sum", other_sum)
		# pprint(other_ids)

		# print("POS")
		result = app.square.orders.batch_retrieve_orders(
			body={
				"location_id": "0W6A3GAFG53BH",
				"order_ids": point_of_sale_order_ids
			}
		)
		if result.is_success():
			# print(result.body)
			for order in result.body.get("orders"):
				for line_item in order.get("line_items"):
					pos_sums[line_item["name"]] = (pos_sums.get(line_item["name"]) or 0) + int(line_item["quantity"])
					print(line_item["name"], line_item["total_money"]["amount"])

		elif result.is_error():
			# print(result.errors)
			pass

		data = sorted(list(sums.items()), key=lambda tup: extract_numbers(tup[0]))
		print([extract_numbers(i[0]) for i in data])
		data = sorted(data, key=lambda tup: extract_month(tup[0]))

		totals["net"] = totals["paid"] - totals["fees"] - totals["expected_refunds"]

	return render_template(
		"members/historic_sales.html",
		data=data,
		totals=totals,
		pos_sum=pos_sums,
		id=show_id,
		errors=errors,
		shows=Show.query.order_by(Show.date.desc()).all(),
		css="bookings.css"
	)


@bp.route("/members/bookings/seating", methods=["GET", "POST"])
@bp.route("/members/bookings/seating/<perf_id>", methods=["GET", "POST"])
def seating_planner(perf_id=""):
	# performance = Performance.query.get("2olqqYkVemQmE7D")
	if perf_id:
		performance = Performance.query.filter_by(id=perf_id).join(Show, Show.id == Performance.show_id).first_or_404()

		if request.method == "POST":
			performance.layout = request.json.get("layout")
			performance.seat_assignments = request.json.get("assignments")

			db.session.commit()
			return "Success"

		else:
			return render_template(
				"members/tickets/seating_planner.html",
				performance=performance,
				modules={
					"wysiwyg": False,
					"tom-select": True
				},
				css="seatingplan.css"
			)
	else:
		if request.method == "POST":
			next_show = Show.query.filter(Show.date > datetime.utcnow()).order_by(Show.date.asc()).first().id
			new_perf = Performance(
				id=Performance.get_new_id(),
				show_id=next_show,
				date=request.form.get("date"),
				layout={"rowCount": 1, "hiddenSeats": [], "newSeats": 0, "fullWidth":  12},
				seat_assignments={}
			)
			db.session.add(new_perf)
			db.session.commit()
			return redirect(url_for("tickets_routes.seating_planner"))
		else:
			return redirect(url_for("tickets_routes.bookings"))


# tickets seat number formatting
# test = "A7, A9, A10, A11, A12, B7, B8, B9, B10, B11, B12, C7, C8, C9, C10, C11, C12, D7, D8, D9, D10, D12"
def group_seats(string):
	testlist = string.split(", ")
	output = []
	temp = ""

	for i in range(0, len(testlist)):
		if temp == "":
			temp = testlist[i]
		row = testlist[i][0]
		seat = int(testlist[i][1:])
		print(row, seat)
		next_seat = row + str(seat+1)
		if i < len(testlist)-1:
			if next_seat != testlist[i+1]:
				if temp != testlist[i]:
					output.append(temp + "-" + testlist[i])
				else:
					output.append(temp)
				temp = ""
		else:
			if temp != testlist[i]:
				output.append(temp + "-" + testlist[i])
			else:
				output.append(temp)

	return output


@bp.route("/members/api/order_webhook", methods=["GET", "POST"])
def new_order_webhook():
	if request.method == "GET":
		return redirect(url_for("routes.frontpage"))

	payload = request.json

	if payload.get("type") != "order.created":
		abort(400)

	# TODO: should also do verification isFromSquare
	# TODO: should probably store these for de-duplication
	payload.get("event_id")

	if data := payload.get("data"):
		if obj := data.get("object"):
			if detail := obj.get("order_created"):
				if detail.get("state") == "COMPLETED":
					result = app.square.orders.retrieve_order(
						order_id=detail.get("order_id")
					)
					order = {}
					if result.is_success():
						order = result.body.get("order")
					elif result.is_error():
						abort(500)
					if webhook := KeyValue.query.get("alerts_webhook"):
						url = webhook.value
						headers = {
							'Content-type': 'application/json'
						}
						for item in order.get('line_items'):
							print(item.get("name"))
							if len(name_split := item.get("name").split(" - ")):
								try:
									perf_date = parser.parse(name_split[1])
									if perf_date < datetime.utcnow():
										perf_date = perf_date.replace(year=perf_date.year+1)
								except (dateutil.parser._parser.ParserError, IndexError):
									perf_date = False
								if perf_date:
									perf = Performance.query.filter_by(date=perf_date).first()
									layout = perf.layout.copy()
									if perf is None:
										data = {
											"content": "",
											"embeds": [
												{
													"type": "rich",
													"title": "New Order",
													"description":
														f"{item.get('name')} x {item.get('quantity')}\n"
														f"but performance was not found in database.",
													"color": 0xcd4a46,
													"url": "https://silchesterplayers.org/members/bookings",
												}
											],
											"type": 1
										}
									else:
										layout["newSeats"] += int(item.get('quantity'))
										data = {
											"content": "",
											"embeds": [
												{
													"type": "rich",
													"title": "New Order",
													"description":
														f"{item.get('name')} x {item.get('quantity')}\n"
														f"Performance now has {layout['newSeats']} unassigned seats.\n"
														f"Sold: {layout['newSeats'] + len(perf.seat_assignments.values())}/{layout['rowCount']*layout['fullWidth']}",
													"color": 0x3CB5B9,
													"url": "https://silchesterplayers.org/members/bookings",
												}
											],
											"type": 1
										}
										perf.layout = layout
										db.session.add(perf)
										db.session.commit()
									requests.post(url=url, data=json.dumps(data), headers=headers)

	return make_response("Success", 200)
