import json
import traceback
from datetime import datetime
from pprint import pprint
from ssl import SSLError

import requests
import sqlalchemy
from flask_login import current_user, login_user, logout_user
from sqlalchemy import and_, cast, literal_column, or_, func, case, String, text
from sqlalchemy.sql import union
from sqlalchemy.dialects.postgresql import aggregate_order_by, ARRAY, array, JSONB

from flask import abort, Blueprint, make_response, redirect, jsonify, \
	render_template, Response, send_file, send_from_directory, url_for, request, session
from flask import current_app as app

from webapp.models import *
from webapp.models import MemberShowLink as MSL
from webapp.react_permissions import default_role_permissions, get_allowed_pages
from webapp.react_support_routes import discord_notif, request_to_json

bp = Blueprint("react_routes", __name__)


@bp.get("/")
@bp.get("/auditions")
def react():
	files_subquery = db.session.query(
		text("post_id"),
		func.json_build_object(
			"id", text("file_id"),
			"name", Files.name.label("file_name")
		).label("file_details")
	).select_from(
		db.session.query(
			Post.id.label("post_id"),
			func.jsonb_array_elements_text(Post.linked_files["files"]).label("file_id"),
		).subquery()
	).join(
		Files, Files.id == text("file_id")
	).subquery()

	data = db.session.query(
		func.json_build_object(
			"type", "post",
			"id", Post.id,
			"title", Post.title,
			"content", Post.content,
			"files", func.array_remove(func.array_agg(
						text("file_details::jsonb")
					), None),
			"frontpage", request.path == "/",
			"show_title", func.array_agg(Show.title)[1]
		)
	).outerjoin(
		files_subquery, Post.id == text("post_id")
	).group_by(
		Post
	).order_by(
		Post.date.desc()
	).filter(
		case(
			(request.path == "/auditions", Post.type == "auditions",),
			else_=or_(Post.type == "public", Post.type == "auditions")
		)
	).join(
		Show, Post.show_id == Show.id
	).filter(
		Show.date > datetime.utcnow(),
		Post.date < datetime.utcnow()
	).limit(1).scalar()

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/blog")
def react_blog():
	blogposts = (Post.query
				.filter_by(type="blog")
				.filter(Post.date < datetime.now())
				.order_by(Post.date.desc())
				.all())
	data = {
		"type": "blogs",
		"title": "Thespian Life",
		"posts": {
			x.id: {
				"title": x.title,
				"date": x.date.strftime("%b %Y"),
				"dateInt": x.date.timestamp(),
				"author": f"{x.user.firstname} {x.user.lastname}",
				"content": x.content
			}
			for x in blogposts
		}
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=json.dumps(data)
		)


@bp.get("/post/<post_id>")
def react_post(post_id):
	post = db.session.query(
		Post
	).filter(
		Post.type.in_(["public", "auditions"])
	).filter(
		Post.id == post_id
	).first_or_404()

	data = {
		"type": "post",
		"title": post.title,
		"content": post.content
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=json.dumps(data)
		)


@bp.get("/past-shows")
def react_past_shows():
	person_map = db.session.query(
		func.jsonb_object_agg(
			text("results.id"), text("results.info")
		)
	).select_from(
		union(
			db.session.query(
				Member.id.label("id"),
				func.jsonb_build_object(
					"name", Member.firstname + " " + Member.lastname,
					"shows", func.array_to_json(func.array_agg(func.distinct(MSL.show_id)))
				).label("info")
			).join(
				MSL, MSL.member_id == Member.id
			).filter(Member.associated_user.is_(None)).group_by(Member),
			db.session.query(
				User.id.label("id"),
				func.jsonb_build_object(
					"name", User.firstname + " " + User.lastname,
					"shows", func.array_to_json(func.array_agg(func.distinct(MSL.show_id)))
				).label("info")
			).join(
				Member, User.id == Member.associated_user
			).join(
				MSL, MSL.member_id == Member.id
			).filter(Member.associated_user.is_not(None)).group_by(User)
		).alias("results")
	).scalar()

	data = {
		"type": "list_shows",
		"default_layout": "cards",
		"title": "Past Shows",
		"shows": [
			{
				"id": show.id,
				"title": show.title,
				"date": show.date.isoformat(),
				"programme": show.programme or "",
				"season": show.season,
				"genre": show.genre
			} for show in Show.query.filter(Show.date<datetime.now()).order_by(Show.date.desc()).all()
		],
		"members": person_map
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/past-shows/m/<person_id>/<name>")
@bp.get("/past-shows/u/<person_id>/<name>")
def react_shows_by_person_redirect(person_id, name):
	return redirect(f"/past-shows/member/{person_id}/{name}")


@bp.get("/past-shows/member/<person_id>/<name>")
def react_shows_by_person(person_id, name=""):
	links = db.session.query(
		Show,
		case(
			(Member.associated_user.is_not(None), User.firstname + " " + User.lastname),
			(Member.associated_user.is_(None), Member.firstname + " " + Member.lastname)
		).label("name"),
		func.string_agg(
			MSL.role_name,
			aggregate_order_by(", ", MSL.order_val)
		).filter(MSL.cast_or_crew == "cast").label("cast"),
		func.string_agg(
			MSL.role_name,
			aggregate_order_by(", ", MSL.order_val)
		).filter(MSL.cast_or_crew == "crew").label("crew")
	).filter(
		or_(
			MSL.member_id.in_(
				db.session.query(Member.id).filter(
					or_(
						Member.associated_user.in_(
							db.session.query(Member.associated_user).filter(Member.id == person_id).scalar_subquery()
						),
						Member.associated_user == person_id,
						Member.id == person_id
					)
				).scalar_subquery()
			),
			MSL.member_id == person_id
		)
	).join(
		Show, Show.id == MSL.show_id
	).join(
		Member, Member.id == MSL.member_id
	).join(
		User, User.id == Member.associated_user, isouter=True
	).group_by(
		Show.id, 'name', Member.associated_user
	).order_by(
		Show.date.desc()
	).all()

	data = {
		"type": "list_shows",
		"default_layout": "table",
		"title": f"{links[0].name}",
		"shows": [
			{
				"id": link.Show.id,
				"title": link.Show.title,
				"date": link.Show.date.isoformat(),
				"programme": link.Show.programme or "",
				"season": link.Show.season,
				"genre": link.Show.genre,
				"cast": link.cast or "",
				"crew": link.crew or ""
			} for link in links
		]
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/past-shows/<show_id>")
def react_past_show_page_redirect(show_id):
	show = Show.query.get(show_id)
	if show is None:
		abort(404)
	data = {
		"type": "redirect",
		"url": f"/past-shows/{show.id}/{show.title.replace(' ', '_')}",
		"text": show.title,
		"time": 0
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/past-shows/<show_id>/<title>")
def react_past_show_page(show_id, title=""):
	details_subquery = db.session.query(
		func.row_to_json(
			literal_column('show')
		).label("details")
	).filter(Show.id == show_id).scalar_subquery()

	photos_subquery = db.session.query(
		func.coalesce(
			func.json_agg(
				aggregate_order_by(
					func.json_build_object(
						"id", ShowImage.id,
						"src", func.concat("/photo_new/", ShowImage.id),
						"width", ShowImage.width,
						"height", ShowImage.height
					), ShowImage.order_value, ShowImage.filename
				)
			),
			'[]'
		)
	).filter(
		ShowImage.show_id == show_id,
	).scalar_subquery()

	# Create a subquery to aggregate face details for each image.
	faces_by_photo = db.session.query(
		ShowImage.id,
		func.json_agg(
			func.json_build_object(
				"member", Face.member_id,
				"name", func.concat(Member.firstname, " ", Member.lastname),
				"x", Face.x,
				"y", Face.y,
				"w", Face.w,
				"h", Face.h,
			)
		).label("faces")
	).join(
		Face, Face.photo_id == ShowImage.id
	).filter(
		ShowImage.show_id == show_id,
	).join(
		Member, Member.id == Face.member_id
	).group_by(
		ShowImage.id
	).subquery()

	# Aggregate the per-image JSON into a single JSON object.
	faces_subquery = db.session.query(
		func.json_object_agg(faces_by_photo.c.id, faces_by_photo.c.faces)
	).select_from(faces_by_photo).scalar_subquery()

	cast_subquery, crew_subquery = [
		db.session.query(
			func.coalesce(
				func.json_agg(
					aggregate_order_by(
						func.json_build_object(
							"role", MSL.role_name,
							"id", Member.id,
							"name", case(
								(Member.associated_user.is_(None), func.concat(Member.firstname, " ", Member.lastname)),
								(
									and_(
										Member.firstname == User.firstname,
										Member.lastname == User.lastname
									),
									func.concat(Member.firstname, " ", Member.lastname)
								),
								else_=func.concat(User.firstname, " ", User.lastname, " (as ", Member.firstname, " ", Member.lastname, ")")
							),
							"order", MSL.order_val
						)
					, MSL.order_val)),
				'[]'
			)
		).join(
			Member, Member.id == MSL.member_id
		).outerjoin(
			User, User.id == Member.associated_user
		).filter(
			MSL.cast_or_crew == cast_or_crew,
			MSL.show_id == show_id
		).scalar_subquery()
		for cast_or_crew in ["cast", "crew"]
	]

	data = db.session.query(
		func.json_build_object(
			"type", "past_show",
			"title", Show.title,
			"show", details_subquery,
			"photos", photos_subquery,
			"faces", faces_subquery,
			"videos", [],
			"cast", cast_subquery,
			"crew", crew_subquery
		)
	).filter(Show.id == show_id).scalar()

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/about-us")
def react_about():
	keys = [
		"about", "maps-url"
	]
	kvs = KeyValue.query.filter(KeyValue.key.in_(keys)).all()
	data = {
		str(kv.key).replace("-", "_").replace("about", "content"): kv.value
		for kv in kvs
	}
	data["type"] = "map_post"
	data["title"] = "About Us"
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=json.dumps(data)
		)


@bp.post("/api/contact")
def contact_form_api():
	try:
		discord_notif(
			f"New Message: {request.json.get('subject')}",
			f"""
				Name: {request.json.get('name')}
				Contact: {request.json.get('contact')}
				{request.json.get('message')}
			"""
		)
	except SSLError as e:
		stack_trace = traceback.format_exc()
		new_error = ErrorLog(
			id=ErrorLog.get_new_id(),
			path=request.path,
			request=request_to_json(request),
			stacktrace=stack_trace
		)
		db.session.add(new_error)
		db.session.commit()
		return {
			"code": 503,
			"msg": "We couldn’t confirm that your message was sent. "
					"Please try again later. "
					"If the issue persists, contact us directly for assistance."
		}
	return {
		"code": 200,
		"msg": "Message sent!"
	}


@bp.get("/search")
def react_search():
	posts = (Post.query
			.filter(Post.type.in_(["public", "auditions", "blog"]))
			.filter(Post.date < datetime.now())
			.order_by(Post.date.desc())
			.all())
	members = (Member.query
				.filter(Member.associated_user.is_(None))
				.all())
	users = (Member.query
				.join(User, Member.associated_user == User.id)
				.all())
	members = members + users
	shows = Show.query.filter(Show.date < datetime.now()).all()
	user_duplicates = []
	data = {
		"type": "search",
		"title": "Search",
		"items": [
			{
				"type": post.type.replace("public", "post").replace("auditions", "post"),
				"title": post.title,
				"href": f"/{post.type.replace('public', 'post').replace('auditions', 'post')}/{post.id}"
			}
			for post in posts
		] + [
			{
				"type": "member",
				"title": f"{member.firstname} {member.lastname}" if member.associated_user is None else f"{member.user.firstname} {member.user.lastname}",
				"href": f"/past-shows/member/{member.id}/{member.firstname}_{member.lastname}" if member.associated_user is None else f"/past-shows/member/{member.user.id}/{member.user.firstname}_{member.user.lastname}{user_duplicates.append(member.user.id) or ''}"
			}
			for member in members
			if (member.associated_user is None) or (member.user.id not in user_duplicates)
		] + [
			{
				"type": "show",
				"title": show.title,
				"href": f"/past-shows/{show.id}/{show.title.replace(' ', '_')}"
			}
			for show in shows
		]
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=json.dumps(data)
		)


@bp.get("/tickets")
def react_tickets():
	db_info = {x.key: x.value for x in KeyValue.query.filter(KeyValue.key.in_(["tickets-active", "tickets-link"])).all()}
	data = {
		"type": "redirect",
		"url": db_info["tickets-link"],
		"condition": db_info["tickets-active"]
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/prizedraw")
def prize_draw():
	data = {
		"type": "prize_draw"
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/api/prizeDraw")
def prize_draw_api():
	try:
		new_entry = PrizeDrawEntry(
			id=PrizeDrawEntry.get_new_id(),
			name=request.form.get("name"),
			email=request.form.get("email"),
			phone_number=request.form.get("phone_number"),
			datetime=datetime.utcnow(),
			terms_agreed=True
		)

		db.session.add(new_entry)
		db.session.commit()
	except sqlalchemy.exc.IntegrityError:
		return {
			"code": 400,
			"msg": "A prize draw entry has already been submitted with these details. </br> We will contact you via phone if you have won."
		}
	except sqlalchemy.exc.DataError:
		return {
			"code": 400,
			"msg": "One of the inputs is too long. </br> Please try again."
		}

	return {
		"code": 200,
		"msg": "Your prize draw entry has been submitted. </br> We will contact you via phone if you have won."
	}


@bp.app_errorhandler(401)
@bp.get("/members")
def react_members(error=None):
	print(error)
	if current_user.is_authenticated:
		data = {
			"type": "redirect",
			"url": "/members/dashboard"
		}
	else:
		member_files = db.session.query(
				func.json_agg(
					func.json_build_object('id', Files.id, 'name', Files.name)
				)
			).filter(
				Files.show_id == 'members_public'
			).scalar()
		data = {
			"type": "login",
			"title": "Members",
			"files": member_files
		}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members")
def react_login(code=0):
	email = request.form.get("email")
	user = db.session.query(
		User
	).filter(User.email == email).first()

	if user is not None and user.verify_password(request.form.get("password")):
		login_user(user)
		return {
			"code": 200,
			"msg": "Login Successful"
		}
	else:
		return {
			"code": 400,
			"msg": "Login Failed - Credentials Invalid"
		}


@bp.get("/members/logout")
def react_logout():
	logout_user()
	data = {
		"type": "redirect",
		"url": "/members",
		"reloadSiteData": True
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/sitedata")
def site_data():
	keys = [
		"site-name", "site_logo",
		"show_auditions", "auditions_date",
		"tickets-active", "tickets-link", "tickets-hero-photo",
		"user_feedback_link",
		"socials"
	]
	kvs = KeyValue.query.filter(KeyValue.key.in_(keys)).all()
	output = {
		str(kv.key).replace("-", "_"): kv.value
		for kv in kvs
	}
	if (db_next_show := Show.query.filter(Show.date > datetime.now()).order_by(
			Show.date.asc()).first()) is not None:
		output["next_show"] = {"title": db_next_show.title, "subtitle": db_next_show.subtitle, "banner": db_next_show.banner}
	if (db_latest_blog := Post.query.filter_by(type="blog").filter(Post.date < datetime.now()).order_by(
			Post.date.desc()).first()) is not None:
		output["latest_blog"] = {"date": db_latest_blog.date.strftime("%b %Y"), "title": db_latest_blog.title, "link": f"/blog/{db_latest_blog.id}"}
	if (db_latest_show := Show.query.filter(Show.date < datetime.now()).order_by(
			Show.date.desc()).first()) is not None:
		output["last_show"] = {"title": db_latest_show.title, "link": f"/past-shows/{db_latest_show.id}/{db_latest_show.title.replace(' ', '_')}", "photos": [f"/photo/{x.photo_url}" for x in ShowPhotos.query.filter_by(show_id=db_latest_show.id).order_by(ShowPhotos.photo_url.desc()).limit(5).all()]}

	output["members_recent_shows"] = db.session.query(
		func.json_agg(
			text("json")
		)
	).select_from(
		db.session.query(
			func.json_build_object(
				"id", Show.id,
				"title", Show.title,
				"url", "/members/show/" + Show.id,
				"season", Show.season,
				"date", Show.date,
				"image", Show.programme,
				"directors", func.array_to_json(func.array_agg(func.distinct(case(
					(Member.associated_user.is_not(None), User.firstname + " " + User.lastname),
					(Member.associated_user.is_(None), Member.firstname + " " + Member.lastname)
				))))
			).label("json")
		).join(
			MSL, Show.id == MSL.show_id, isouter=True
		).filter(
			MSL.role_name.in_(["Director", "Producer"]),
			MSL.cast_or_crew == "crew"
		).join(
			Member, MSL.member_id == Member.id
		).join(
			User, Member.associated_user == User.id, isouter=True
		).group_by(Show).order_by(Show.date.desc()).limit(10).subquery()
	).scalar()

	if current_user.is_authenticated:
		output["current_user"] = {
			"is_authenticated": True,
			"role": current_user.role,
			"id": current_user.id
		}

		output["square"] = {
			"appId": app.envs.square_app_id,
			"membershipLocationId": app.envs.square_membership_location
		}

		output["memberDocs"] = {
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

		output["memberNavItemsToShow"] = get_allowed_pages()

		output["mostRecentMemberShows"] = db.session.query(
			func.json_agg(
				func.json_build_object(
					"id", text('id'),
					"title", text('title')
				)
			)
		).select_from(
			db.session.query(
				Show.id.label("id"), Show.title.label("title")
			).order_by(Show.date.desc()).limit(4).subquery()
		).scalar()
	else:
		output["current_user"] = {
			"is_authenticated": False
		}
		output["memberNavItems"] = []

	return jsonify(output)


@bp.post("/cors")
def cors():
	data = request.json
	response = requests.get(data.get("url"))
	return response.text


@bp.get("/testmd")
def test_md():
	with open("E:/004_Repos/open-amdram-portal/test.md", "r", encoding="utf8") as file:
		content = file.read()
	data = {
		'type': 'post',
		'title': "Markdown Stress Test",
		'content': content
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)