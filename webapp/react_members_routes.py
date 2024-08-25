import io
import json
import uuid

import pyotp
import qrcode
from dateutil.relativedelta import relativedelta
from sqlalchemy import and_, case, column, extract, func, literal, not_, or_, sql, literal_column, union_all, text
from sqlalchemy.dialects.postgresql import aggregate_order_by

from webapp.models import MemberShowLink as MSL
from webapp.models import *

from flask import abort, Blueprint, flash, make_response, redirect, render_template, send_file, session, url_for, \
	request, jsonify
from flask import current_app as app
from flask_login import login_user, logout_user, current_user, login_required

from webapp.react_permissions import check_page_permission

bp = Blueprint("react_members_routes", __name__)


@bp.route("/members/dashboard")
@login_required
def react_dashboard():
	check_page_permission("dashboard")
	posts = db.session.query(
		func.json_agg(
			func.json_build_object(
				'id', text("results.id"),
				'title', text("results.title"),
				'date', text("results.date"),
				'content', text("results.content"),
				'show_title', text("results.show_title"),
				'type', text("results.type")
			)
		)
	).select_from(
		db.session.query(
			Post.id.label('id'),
			Post.title.label('title'),
			Post.date.label('date'),
			Post.content.label('content'),
			Show.title.label('show_title'),
			literal_column("'post'").label('type')
		).join(
			Show, Post.show_id == Show.id
		).filter(
			Post.type.in_(["auditions", "private"]),
			Post.date > datetime.utcnow() - relativedelta(months=2)
		).union(
			db.session.query(
				Files.id.label('id'),
				Files.name.label('title'),
				Files.date.label('date'),
				literal(None).label('content'),
				Show.title.label('show_title'),
				literal_column("'file'").label('type')
			).join(
				Show, Files.show_id == Show.id
			).filter(
				Files.date > datetime.utcnow() - relativedelta(months=2)
			)
		).subquery().alias("results")
	).scalar() or []

	data = {
		"type": "dashboard",
		"title": "Dashboard",
		"posts": posts
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/members/docs")
@login_required
def members_docs():
	check_page_permission("member_docs")
	data = {
		"type": "post",
		"title": "Members Docs",
		"content": "",
		"files_title": "Members Docs",
		"files": db.session.query(
			func.json_agg(
				func.json_build_object(
					'id', Files.id,
					'name', Files.name
				)
			)
		).filter(
			Files.show_id.in_(["members_public", "members_private"])
		).scalar()
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/members/post/<post_id>")
@login_required
def react_members_post(post_id):
	check_page_permission("shows")
	data = db.session.query(
		func.json_build_object(
			'type', 'post',
			'title', Post.title,
			'date', Post.date,
			'content', Post.content,
			'show_title', Show.title,
			"files_title", "Files",
			'post_files', Post.linked_files
		)
	).join(Show, Post.show_id == Show.id).filter(
		Post.id == post_id
	).first()[0]

	files = Files.query.filter(Files.id.in_((data.get('post_files') or {}).get("files", [])))

	data['files'] = [
		{'id': file.id, 'name': file.name} for file in files
	]

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/members/shows")
@login_required
def react_members_shows():
	check_page_permission("shows")
	data = {}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/members/show/<show_id>")
@login_required
def react_members_show(show_id):
	check_page_permission("shows")
	posts = db.session.query(
		func.json_build_object(
			'posts', func.json_agg(
				func.json_build_object(
					'id', text("posts.id"),
					'title', text("posts.title"),
					'date', text("posts.date"),
					'content', text("posts.content"),
					'show_title', text("posts.show_title"),
					'type', 'post'
				)
			)
		)
	).select_from(
		db.session.query(
				Post.id.label("id"),
				Post.title.label("title"),
				Post.date.label("date"),
				Post.content.label("content"),
				Show.title.label("show_title")
		).join(
			Show, Post.show_id == Show.id
		).filter(
			Show.id == show_id,
			Post.type.in_(["auditions", "private"])
		).order_by(Post.date.desc()).scalar_subquery().alias("posts")
	).scalar()

	files = db.session.query(
		func.json_build_object(
			'files', func.json_agg(func.json_build_object(
					'id', text("files.id"),
					'title', text("files.title"),
					'date', text("files.date"),
					'content', None,
					'show_title', text("files.show_title"),
					'type', 'file'
				))
		)
	).select_from(
		db.session.query(
				Files.id.label("id"),
				Files.name.label("title"),
				Files.date.label("date"),
				Show.title.label("show_title")
		).join(
			Show, Files.show_id == Show.id
		).filter(
			Show.id == show_id
		).order_by(Files.date.desc()).scalar_subquery().alias("files")
	).scalar()

	show_details = db.session.query(
		func.json_build_object(
			'id', Show.id,
			'title', Show.title,
			"directors", func.array_to_json(func.array_agg(func.distinct(case(
				(Member.associated_user.is_not(None), Member.associated_user)
			))))
		)
	).join(
		MSL, Show.id == MSL.show_id, isouter=True
	).filter(
		MSL.role_name.in_(["Director", "Producer"]),
		MSL.cast_or_crew == "crew",
		Show.id == show_id
	).join(
		Member, MSL.member_id == Member.id
	).join(
		User, Member.associated_user == User.id, isouter=True
	).group_by(Show).order_by(Show.date.desc()).scalar()

	data = {
		"type": "members_show",
		**posts,
		**files,
		**show_details
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/register")
def register_account():
	missing_field_responses = {
		"firstname": "First Name not provided.",
		"lastname": "Last Name not provided.",
		"email": "Email not provided.",
		"password": "Password not provided.",
		"confirm_password": "Password Confirmation not provided."
	}
	for field, response in missing_field_responses.items():
		if not request.form.get("field"):
			return {
				"code": 400,
				"msg": response
			}

	if request.form.get("password") != request.form.get("confirm_password"):
		return {
			"code": 400,
			"msg": "Password does not match Confirm Password."
		}

	if db.session.query(func.count(User.email)).filter(User.email == request.form.get("email")):
		return {
			"code": 400,
			"msg": "Email address already used by another account."
		}

	new_user = User(
		firstname=request.form.get("firstname"),
		lastname=request.form.get("lastname"),
		email=request.form.get("email"),
		password=request.form.get("password"),
	)
	db.session.add(new_user)
	db.session.commit()
	login_user(new_user)
	return {
		"code": 200,
		"msg": "Successfully created new user account"
	}


@bp.get("/members/account_settings")
@login_required
def account_settings():
	check_page_permission("account_settings")
	subs_options = db.session.query(
		func.json_agg(func.json_build_object(
			"id", SubscriptionPlan.id,
			"name", SubscriptionPlan.name,
			"amount", SubscriptionPlan.amount,
			"desc", SubscriptionPlan.desc,
			"enabled", SubscriptionPlan.enabled,
			"period", SubscriptionPlan.period,
			"renewal_month", SubscriptionPlan.renewal_month,
			"plan_id", SubscriptionPlan.plan_id,
			"initial_variation_id", SubscriptionPlan.plan_id,
			"continuing_variation_id", SubscriptionPlan.plan_id,
			"square_env", SubscriptionPlan.plan_id,
		))
	).filter(
		SubscriptionPlan.square_env == app.envs.square_environment
	).scalar()

	active_subs = db.session.query(
		func.json_agg(func.json_build_object(
			"id", Subscription.id,
			"plan", Subscription.plan,
			"name", Subscription.name,
			"plan_name", SubscriptionPlan.name,
			"plan_amount", SubscriptionPlan.amount,
		))
	).filter(
		Subscription.user_id == current_user.id,
		Subscription.active
	).join(SubscriptionPlan, Subscription.plan == SubscriptionPlan.id).scalar()

	key = current_user.otp_secret or session.get("key") or pyotp.random_base32()
	session["key"] = key
	session.modified = True
	totp = pyotp.totp.TOTP(key)
	provisioning_uri = totp.provisioning_uri(name=current_user.email, issuer_name='Silchester Players Members')
	qr = qrcode.QRCode(border=1)
	qr.add_data(provisioning_uri)
	data = {
		"type": "account_settings",
		"title": "Account Settings",
		"update_profile": {
			"firstname": current_user.firstname,
			"lastname": current_user.lastname
		},
		"update_contact_details": {
			"phone_number": current_user.phone_number
		},
		"emergency_contact": {
			"name": current_user.e_con_name,
			"number": current_user.e_con_phone
		},
		"two_factor": {
			"enabled": bool(current_user.otp_secret),
			"provisioning_qr": qr.get_matrix()
		},
		"subs": {
			"options":  subs_options,
			"active": active_subs
		}
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/account_settings/start_subscription")
@login_required
def start_subscription():
	standard_form_missing_responses = {
		"cardNonce": "Card details missing.",
		"verfToken": "Card details missing.",
		"cardJson": "Card details missing.",
		"subs_level": "Subscription Level not chosen.",
		"sub_for": "Subscription recipient not chosen.",
	}
	extra_form_missing_responses = {
		"name": "Subscription recipient name not given.",
		"phone": "Subscription recipient phone number not given.",
		"e_con_name": "Subscription recipient emergency contact name not given.",
		"e_con_phone": "Subscription recipient emergency contact phone number not given."
	}

	for key in standard_form_missing_responses.keys():
		if not request.form.get(key):
			return {
				"code": 400,
				"msg": standard_form_missing_responses[key]
			}
	if request.form.get("sub_for") != "SELF":
		for key in extra_form_missing_responses.keys():
			if not request.form.get(key):
				return {
					"code": 400,
					"msg": extra_form_missing_responses[key]
				}

	if not (plan := db.session.query(
			SubscriptionPlan
		).filter(
			SubscriptionPlan.id == request.form.get("subs_level")
		).first()):
		return {
			"code": 400,
			"msg": "Invalid Subscription Plan."
		}

	if not current_user.square_customer_id or app.envs.square_environment == "sandbox":
		sq_id = ""
		results = app.square.customers.search_customers(
			body={
				"limit": 1,
				"query": {
					"filter": {
						"email_address": {
							"exact": current_user.email
						}
					}
				}
			}
		)

		if results.is_error():
			error = results.errors[0]
			return {
				"code": 400,
				"msg": f"Couldn't lookup customer profile. {error.get('detail')} - {error.get('field')} - {error.get('code')}"
			}
		elif results.is_success():
			if len(results.body.get("customers")):
				sq_id = results.body.get("customers")[0].get("id")
			else:
				result = app.square.customers.create_customer(
					body={
						"given_name": current_user.firstname,
						"family_name": current_user.lastname,
						"email_address": current_user.email,
						"reference_id": current_user.id
					}
				)

				if result.is_error():
					error = result.errors[0]
					return {
						"code": 400,
						"msg": f"Couldn't create customer profile. {error.get('detail')} - {error.get('field')} - {error.get('code')}"
					}
				elif result.is_success():
					sq_id = result.body.get("customer").get("id")

				if not sq_id:
					return {
						"code": 400,
						"msg": f"Couldn't create or find customer profile."
					}
		if app.envs.square_environment != "sandbox":
			current_user.square_customer_id = sq_id
			db.session.commit()
	else:
		sq_id = current_user.square_customer_id
	card_result = app.square.cards.create_card(
		body={
			"idempotency_key":  str(uuid.uuid4()),
			"source_id": request.form.get("cardNonce"),
			"verification_token": request.form.get("verfToken"),
			"card": {
				**json.loads(request.form.get("cardJson")),
				"customer_id": sq_id
			}
		}
	)

	if card_result.is_error():
		error = card_result.errors[0]
		return {
			"code": 400,
			"msg": f"Couldn't save card for payment. {error.get('detail')} - {error.get('field')} - {error.get('code')}"
		}
	else:
		now = datetime.now()
		renewal_month = int(plan.renewal_month)
		new_sub = {}
		start_date = {}
		if now.month != renewal_month:
			new_sub_result = app.square.subscriptions.create_subscription(
				body={
					"idempotency_key": str(uuid.uuid4()),
					"location_id": app.envs.square_membership_location,
					"customer_id": sq_id,
					"card_id": card_result.body.get("card").get("id"),
					"monthly_billing_anchor_date": 1,
					"plan_variation_id": plan.initial_variation_id
				}
			)
			if new_sub_result.is_success():
				new_sub = new_sub_result.body
				date = datetime(year=now.year + 1 * (now.month > renewal_month), month=renewal_month, day=1)
				start_date = {"start_date": date}
			else:
				return {
					"code": 400,
					"msg": f"Couldn't start subscription - {new_sub_result.errors[0].get('code')}"
				}
		continuing_sub_result = app.square.subscriptions.create_subscription(
			body={
				"idempotency_key": str(uuid.uuid4()),
				"location_id": app.envs.square_membership_location,
				"customer_id": sq_id,
				"card_id": card_result.body.get("card").get("id"),
				"monthly_billing_anchor_date": 1,
				"plan_variation_id": plan.continuing_variation_id,
				**start_date
			}
		)
		if continuing_sub_result.is_success():
			new_subscription = Subscription(
				id=Subscription.get_new_id(),
				user_id=current_user.id,
				plan=plan.id,
				sub_for=request.form.get("sub_for"),
				name=request.form.get("name") or f"{current_user.firstname} {current_user.lastname}",
				phone_number=request.form.get("phone") or current_user.phone_number,
				e_con_name=[None, request.form.get("e_con_name")][int(request.form.get("sub_for") != "SELF")],
				e_con_phone=[None, request.form.get("e_con_phone")][int(request.form.get("sub_for") != "SELF")],
				square_initial_id=(new_sub.get("subscription") or {}).get("id") or None,
				square_continuing_id=continuing_sub_result.body.get("subscription").get("id"),
				square_env=app.envs.square_environment
			)
			db.session.add(new_subscription)
			db.session.commit()

			return {
				"code": 200,
				"msg": "Subscription started successfully"
			}
		else:
			return {
				"code": 400,
				"msg": f"Couldn't start subscription - {continuing_sub_result.errors[0].get('code')}"
			}


@bp.get("/members/api/account_settings/cancel_subscription/<sub_id>")
@login_required
def cancel_subscription(sub_id):
	sub = db.session.query(
		Subscription
	).filter(
		Subscription.id == sub_id
	).filter(
		Subscription.user_id == current_user.id
	).first()

	if not sub:
		return {
			"code": 404,
			"msg": "Subscription not found."
		}

	result = app.square.subscriptions.cancel_subscription(
		subscription_id=sub.square_continuing_id
	)

	if result.is_success():
		sub.active = False
		db.session.commit()
		return {
			"code": 200,
			"msg": f"Successfully cancelled subscription."
		}
	elif result.is_error():
		return {
			"code": 400,
			"msg": f"Couldn't end subscription, try again or contact admin. - {result.errors[0].get('detail')}"
		}


@bp.post("/members/api/account_settings/change_password")
@login_required
def change_password():
	if current_user.verify_password(request.form.get("old_password")):
		if request.form.get("new_password") == request.form.get("confirm_new_password"):
			current_user.password = request.form.get("new_password")
			db.session.commit()
			return {
				"code": 200,
				"msg": "Password changed successfully"
			}
		else:
			return {
				"code": 400,
				"msg": "New and Confirm New passwords do not match"
			}
	else:
		return {
			"code": 400,
			"msg": "Current password is incorrect"
		}


@bp.post("/members/api/account_settings/update_profile")
@login_required
def update_profile():
	if request.form.get("firstname") and request.form.get("lastname"):
		if not 0 < len(request.form.get("firstname") or "") <= 20:
			return {
				"code": 400,
				"msg": "Firstname length invalid (must be between 1 and 20 characters)"
			}
		if not 0 < len(request.form.get("lastname") or "") <= 30:
			return {
				"code": 400,
				"msg": "Lastname length invalid (must be between 1 and 30 characters)"
			}
		current_user.firstname = request.form.get("firstname")
		current_user.lastname = request.form.get("lastname")
		db.session.commit()
		return {
			"code": 200,
			"msg": "Profile updated successfully"
		}
	else:
		return {
			"code": 400,
			"msg": "Form invalid"
		}


@bp.post("/members/api/account_settings/update_contact_details")
@login_required
def update_contact_details():
	if request.form.get("phone_number"):
		phone_number = (request.form.get("phone_number") or "").replace(" ", "")
		if not 10 <= len(phone_number) <= 13:
			return {
				"code": 400,
				"msg": "Phone number length invalid (must be between 10 and 13 digits)"
			}
		current_user.phone_number = phone_number
		db.session.commit()
		return {
			"code": 200,
			"msg": "Contact Details updated successfully"
		}
	else:
		return {
			"code": 400,
			"msg": "Form invalid"
		}


@bp.post("/members/api/account_settings/two_factor")
@login_required
def setup_two_factor():
	key = session.get("key")
	if key is None:
		return {
			"code": 400,
			"msg": "Something went wrong, 2FA failed to set up. Please delete saved generator from your 2FA app"
		}
	totp = pyotp.totp.TOTP(key)
	if totp.verify(request.form.get("otp_code")):
		current_user.otp_secret = key
		db.session.commit()
		return {
			"code": 200,
			"msg": "2FA enabled successfully."
		}
	else:
		return {
			"code": 400,
			"msg": "Submitted code invalid, 2FA failed to set up. If this happens again, delete the generator from "
				"your 2FA app and start again."
		}


@bp.post("/members/api/account_settings/emergency_contact")
@login_required
def update_emergency_contact():
	if request.form.get("e_con_name") and request.form.get("e_con_phone"):
		phone_number = (request.form.get("e_con_phone") or "").replace(" ", "")
		if not 10 <= len(phone_number) <= 13:
			return {
				"code": 400,
				"msg": "Phone number length invalid (must be between 10 and 13 digits)"
			}
		name = request.form.get("e_con_name") or ""
		if not 1 <= len(name) <= 50:
			return {
				"code": 400,
				"msg": "Name length invalid (must be between 1 and 50 characters)"
			}
		current_user.e_con_name = request.form.get("e_con_name")
		current_user.e_con_phone = request.form.get("e_con_phone")
		db.session.commit()
		return {
			"code": 200,
			"msg": "Profile updated successfully"
		}
	else:
		return {
			"code": 400,
			"msg": "Form invalid"
		}


@bp.get("/members/admin/admin_settings")
@login_required
def admin_settings():
	check_page_permission("admin")
	settings = {
		i.key: i.value
		for i in KeyValue.query.all()
	}

	subs = db.session.query(
		func.json_agg(func.json_build_object(
			"id", SubscriptionPlan.id,
			"name", SubscriptionPlan.name,
			"amount", SubscriptionPlan.amount,
			"desc", SubscriptionPlan.desc,
			"enabled", SubscriptionPlan.enabled,
			"period", SubscriptionPlan.period,
			"plan_id", SubscriptionPlan.plan_id,
			"initial_variation_id", SubscriptionPlan.plan_id,
			"continuing_variation_id", SubscriptionPlan.plan_id,
			"square_env", SubscriptionPlan.plan_id,
		))
	).filter(
		SubscriptionPlan.square_env == app.envs.square_environment
	).scalar()

	data = {
		"type": "admin_settings",
		"title": "Admin Settings",
		"settings": {
			"siteName": settings.get("site-name"),
			"ticketsActive": settings.get("tickets-active"),
			"ticketsLink": settings.get("tickets-link"),
			"ticketsHeroPhoto": settings.get("tickets-hero-photo"),
			"about": settings.get("about"),
			"socials": settings.get("socials"),
			"mapsURL": settings.get("maps-url"),
		},
		"subs": subs
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/admin/admin_settings/site_settings")
def set_admin_settings():
	check_page_permission("admin")
	for key, value in request.form.items():
		KeyValue.query.filter_by(key=key).first().value = value

	db.session.commit()
	flash("Site Settings Successfully Updated")
	return {
		"code": 200,
		"msg": "Site Settings Successfully Updated"
	}


@bp.post("/members/api/admin/admin_settings/subs/add_new_plan")
@login_required
def add_new_subs_plan():
	check_page_permission("admin")
	current_plan_names = db.session.query(
		func.json_agg(SubscriptionPlan.name)
	).filter(SubscriptionPlan.square_env == app.envs.square_environment).scalar()
	if (name := request.form.get('levelName').lower()) in current_plan_names:
		return {
			"code": 400,
			"msg": "Subs Level with that name already exists"
		}
	if request.form.get("period") == "yearly":
		plan_data = {
			"name": f"{name.capitalize()} Membership",
			"subscription_plan_variations": [
				{
					"id": "#initial_membership",
					"type": "SUBSCRIPTION_PLAN_VARIATION",
					"subscription_plan_variation_data": {
						"name": f"{name.capitalize()} Membership",
						"phases": [
							{
								"cadence": "ANNUAL",
								"pricing": {
									"price_money": {
										"amount": int(float(request.form.get("amount")) * 100),
										"currency": "GBP"
									},
									"type": "STATIC"
								},
								"periods": 1
							}
						]
					}
				},
				{
					"id": "#continuing_membership",
					"type": "SUBSCRIPTION_PLAN_VARIATION",
					"subscription_plan_variation_data": {
						"name": f"{name.capitalize()} Membership",
						"phases": [
							{
								"cadence": "ANNUAL",
								"pricing": {
									"price_money": {
										"amount": int(float(request.form.get("amount")) * 100),
										"currency": "GBP"
									},
									"type": "STATIC"
								}
							}
						]
					}
				}
			]
		}
	else:
		return {
			"code": 400,
			"msg": "Invalid period selected."
		}

	result = app.square.catalog.upsert_catalog_object(
		body={
			"idempotency_key": str(uuid.uuid4()),
			"object": {
				"id": f"#{name}",
				"type": "SUBSCRIPTION_PLAN",
				"subscription_plan_data": plan_data
			}
		}
	)

	if result.is_error():
		return {
			"code": 400,
			"msg": f"Adding new subscription failed: {result.errors}"
		}
	elif result.is_success():
		catalog_object = result.body.get("catalog_object")
		id_mappings = {
			i.get("client_object_id"): i.get("object_id")
			for i in result.body.get("id_mappings")
		}
		if request.form.get("period") == "yearly":
			new_plan = SubscriptionPlan(
				id=SubscriptionPlan.get_new_id(),
				name=name,
				amount=int(float(request.form.get("amount")) * 100),
				enabled=True,
				period=request.form.get("period"),
				renewal_month=int(request.form.get("renewal_month")),
				plan_id=catalog_object.get("id"),
				initial_variation_id=id_mappings.get("#initial_membership"),
				continuing_variation_id=id_mappings.get("#continuing_membership"),
				square_env=app.envs.square_environment
			)
		else:
			return {
				"code": 400,
				"msg": "Invalid period selected."
			}

		# subs_levels[name] = new_subscription
		# KeyValue.query.get("subs_levels").value = json.dumps(subs_levels)
		db.session.add(new_plan)
		db.session.commit()
		return {
			"code": 200,
			"msg": "Plan added successfully"
		}


@bp.post("/members/api/new_post/<show_id>")
@login_required
def new_post(show_id):
	check_page_permission("shows_write", show_id=show_id)

	post = Post(
		id=Post.get_new_id(),
		type=request.form.get("type"),
		show_id=show_id,
		author=current_user.id,
		title=request.form.get("title"),
		content=request.form.get("content"),
		date=request.form.get("date"),
		linked_files={'files': []}
	)

	# TODO: add file selection to post form

	db.session.add(post)
	db.session.commit()

	return {
		"code": 200,
		"msg": "Post created successfully"
	}


@bp.post("/members/api/upload_file/<show_id>")
@login_required
def upload_file(show_id):
	check_page_permission("shows_write", show_id=show_id)

	if request.files:
		for file in request.files.getlist("files"):
			new_file = Files(
				id=Files.get_new_id(),
				show_id=show_id,
				name=file.filename,
				content=file.read()
			)
			db.session.add(new_file)
		db.session.commit()
		return {
			"code": 200,
			"msg": "Files successfully uploaded"
		}
	else:
		abort(400)


@bp.get("/members/api/delete_file/<file_id>")
@login_required
def delete_file(file_id):
	file = db.session.query(
		Files
	).filter(
		Files.id == file_id
	).first_or_404()

	check_page_permission("shows_write", show_id=file.show_id)

	db.session.delete(file)
	db.session.commit()

	return {
			"code": 200,
			"msg": "File successfully deleted"
		}


@bp.route("/file/<file_id>/<filename>", methods=["GET"])
@bp.route("/members/file/<file_id>/<filename>", methods=["GET"])
def file_direct(file_id, filename):
	"""member,author,admin"""
	if str(request.url_rule) == "/file/<file_id>/<filename>":
		if "download" in request.args.keys():
			file = db.session.query(
				Files.name,
				Files.content
			).filter(
				Files.id == file_id,
				or_(
					Files.show_id == "members_public",
					db.session.query(
						func.count(Post.id)
					).filter(
						Post.type != "private",
						Post.linked_files['files'].op("@>")([file_id])
					).scalar_subquery() >= 1
				)
			).first_or_404()
			return send_file(io.BytesIO(file.content), download_name=file.name)
		else:
			data = db.session.query(
				func.json_build_object(
					'type', "file_page",
					'id', Files.id,
					'date', Files.date,
					'title', Files.name,
					'show_title', Show.title,
					'url', "/file/" + Files.id + "/" + func.replace(Files.name, " ", "_") + "?download",
				)
			).join(
				Show,
				Show.id == Files.show_id,
				isouter=True
			).filter(
				Files.id == file_id,
				or_(
					Files.show_id == "members_public",
					db.session.query(
						func.count(Post.id)
					).filter(
						Post.type != "private",
						Post.linked_files['files'].op("@>")([file_id])
					).scalar_subquery() >= 1
				)
			).limit(1).scalar()
			if "react" in request.args.keys():
				return jsonify(data)
			else:
				return render_template(
					"react_template.html",
					data=data
				)
	elif current_user.is_authenticated:
		if "download" in request.args.keys():
			file = db.session.query(
				Files.name,
				Files.content
			).filter(
				Files.id == file_id
			).first_or_404()
			return send_file(io.BytesIO(file.content), download_name=file.name)
		else:
			data = db.session.query(
				func.json_build_object(
					'type', "file_page",
					'id', Files.id,
					'date', Files.date,
					'title', Files.name,
					'show_title', Show.title,
					'url', "/members/file/" + Files.id + "/" + func.replace(Files.name, " ", "_") + "?download",
				)
			).join(
				Show,
				Show.id == Files.show_id,
				isouter=True
			).filter(
				Files.id == file_id
			).limit(1).scalar()
			if "react" in request.args.keys():
				return jsonify(data)
			else:
				return render_template(
					"react_template.html",
					data=data
				)
	else:
		flash("Please log in to access this resource.")
		abort(401)


@bp.route("/members/logout")
@login_required
def logout():
	"""member,author,admin"""
	logout_user()
	return redirect(url_for("routes.frontpage"))
