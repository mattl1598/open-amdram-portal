import json
import re
from io import BytesIO
from pprint import pprint

import xlsxwriter
from flask import Blueprint, make_response, render_template, request, session, abort, jsonify
from flask_login import current_user, login_required
# import datetime
from datetime import timedelta, datetime

from webapp.models import *
from flask import current_app as app

bp = Blueprint("tickets_routes", __name__)


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

	def __repr__(self):
		return str({
			"ref": self.ref,
			"name": self.name,
			"note": self.note,
			"date": self.date,
			"order_id": self.id,
			"tickets": self.tickets,
			"tickets_count": self.tickets_total()
		})

	def __str__(self):
		return str(self.__repr__())

	def default(self):
		return self.__repr__()

	def __add__(self, other):
		self.merge(other)
		return self

	def merge(self, new_order) -> None:
		if self.id == new_order.id and self.date == new_order.date:
			for k, v in new_order.tickets.items():
				self.tickets[k] = v + self.tickets.setdefault(k, 0)
		else:
			raise ValueError

	def tickets_total(self) -> int:
		return sum(self.tickets.values())


@bp.get('/members/get_orders')
@login_required
def get_orders():
	"""admin"""
	if current_user.role not in ["admin"]:
		abort(403)
	now = datetime.now() - timedelta(days=1)
	end_of_last_show = Show.query.filter(Show.date < now).order_by(Show.date.desc()).first().date + timedelta(days=1)

	square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"

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
		test = []
		for i in range(0, len(results.body.get("orders") or [])):
			order = results.body["orders"][i]
			for item in order["line_items"]:
				try:
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
					test.append(order_info)
				except KeyError as e:
					pass
					# pprint(order)
					# print(e)

		for item in test:
			keys = list(item.tickets.keys())[0].split(" - ", 2)
			item.tickets[keys[2]] = item.tickets.pop(list(item.tickets.keys())[0])
			if (existing := perf_tree[keys[0]][keys[1]].get(item.id)) is not None:
				perf_tree[keys[0]][keys[1]][item.id] = existing + item
			else:
				perf_tree[keys[0]][keys[1]][item.id] = item

		output = BytesIO()
		workbook = xlsxwriter.Workbook(output)

		for a, b in perf_tree.items():
			for x, y in b.items():
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

				worksheet_name = f"{''.join([i[0] for i in a.split(' ')])} - {dt.strftime('%a %d %b %I.%M%p')}"
				worksheet = workbook.add_worksheet(name=worksheet_name)
				worksheet.write("A1", f"{a} - {x}")

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
