import base64
from datetime import datetime
from io import BytesIO
from pprint import pprint

import dateparser
import requests

from flask import Blueprint, make_response, redirect, render_template, request
from flask import current_app as app

# from webapp import db
from webapp.react_support_routes import discord_notif
from webapp.models import db, KeyValue, Performance, Show

bp = Blueprint("react_email_routes", __name__)


@bp.get("/api/get_zoho_auth")  # TODO: remove
def get_auth_code():
	client_id = app.envs.zoho_id
	redirect_uri = "https://silchesterplayers.org/api/save_zoho_auth"
	scope = "ZohoMail.messages.CREATE"
	access_type = "offline"
	url = f"https://accounts.zoho.eu/oauth/v2/auth?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}&scope={scope}&access_type={access_type}"
	return redirect(url)


@bp.get("/api/save_zoho_auth")
def save_zoho_auth():
	discord_notif(
		"Zoho Auth Code",
		str(request.args)
	)

	return "ok"


@bp.get("/api/get_zoho_refresh_token")
def get_zoho_refresh_token():
	authorization_code = app.envs.zoho_code
	client_id = app.envs.zoho_id
	client_secret = app.envs.zoho_secret
	redirect_uri = "https://silchesterplayers.org/api/save_zoho_auth"
	scope = "ZohoMail.messages.CREATE"
	url = f"https://accounts.zoho.eu/oauth/v2/token?code={authorization_code}&grant_type=authorization_code&client_id={client_id}&client_secret={client_secret}&redirect_uri={redirect_uri}&scope={scope}"
	response = requests.post(url)
	return response.json()


@bp.get("/api/get_zoho_access_token")
def get_zoho_access_token():
	refresh_token = app.envs.zoho_refresh
	client_id = app.envs.zoho_id
	client_secret = app.envs.zoho_secret
	url = f"https://accounts.zoho.eu/oauth/v2/token?refresh_token={refresh_token}&grant_type=refresh_token&client_id={client_id}&client_secret={client_secret}"
	response = requests.post(url)
	return response.json().get("access_token")


# @bp.get("/api/send_email")
def send_email(body, subject, to, email_from, bcc=[]):
	account_id = app.envs.zoho_account_id
	url = f"https://mail.zoho.eu/api/accounts/{account_id}/messages"
	headers = {
		"Accept": "application/json",
		"Content-Type": "application/json",
		"Authorization": f"Zoho-oauthtoken {get_zoho_access_token()}"
	}

	data = {
		"fromAddress": email_from,
		"toAddress": to,
		"bccAddress": ",".join(bcc),
		"subject": subject,
		"content": body,
		"askReceipt": "no"
	}
	response = requests.post(url, headers=headers, json=data)
	return response.json()


def send_order_confirmation(order):
	items = {}

	for item in order.order.line_items:
		if int(item.quantity) > 0:
			perf = db.session.query(
				Performance.id,
				Performance.show_id
			).filter(
				Performance.date == dateparser.parse(item.name.split(" - ")[1])
			).first()

			show_perfs = db.session.query(
				Performance.id
			).filter(
				Performance.show_id == perf.show_id
			).order_by(
				Performance.date.asc()
			).all()

			perf_ids = [p.id for p in show_perfs]
			perf_num = perf_ids.index(perf.id) + 1

			if perf.id not in items.keys():
				items[perf.id] = {
					"name": item.name.split(" - ")[0],
					"date": item.name.split(" - ")[1],
					"perf_id": perf.id,
					"perf_num": perf_num,
					"perf_count": len(perf_ids),
					"tickets": [],
					"total": int(item.total_money.amount)
				}

			items[perf.id]["tickets"].append({
				"type": item.name.split(" - ")[2],
				"quantity": int(item.quantity),
				"price": int(item.base_price_money.amount),
				"total": int(item.total_money.amount)
			})

	fulfillment = order.order.fulfillments[0]
	recipient = fulfillment.pickup_details.recipient

	order_details = {
		"name": recipient.display_name,
		"email": recipient.email_address,
		"note": fulfillment.pickup_details.note,
		"total": order.order.total_money.amount,
		"date": datetime.strptime(order.order.created_at, "%Y-%m-%dT%H:%M:%S.%fZ")
	}

	body = render_template("order_email_template.html", items=items, order_details=order_details)

	send_email(body, subject="Order Confirmation - Silchester Players", to=order_details["email"], bcc=app.envs.bcc, email_from=app.envs.box_office_email)

	return body


@bp.get("/ticket_image/<perf_id>")
def ticket_image(perf_id):
	show = db.session.query(
		Show.ticket_image
	).filter(
		Performance.id == perf_id
	).join(
		Performance, Performance.show_id == Show.id
	).first()
	return redirect(show.ticket_image)


@bp.get("/logo.png")
def logo_png():
	logo_png = db.session.query(KeyValue).get("site_logo_png").value

	response = make_response(base64.b64decode(logo_png))
	response.headers["Content-Type"] = "image/png"

	return response
