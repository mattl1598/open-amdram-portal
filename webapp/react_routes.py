import json
from datetime import datetime
from pprint import pprint
import requests
from flask_login import current_user
from sqlalchemy import literal_column, or_, func, case, text
from sqlalchemy.dialects.postgresql import aggregate_order_by

from flask import abort, Blueprint, make_response, redirect, jsonify, \
	render_template, Response, send_file, send_from_directory, url_for, request, session

from webapp.models import *
from webapp.models import MemberShowLink as MSL
bp = Blueprint("react_routes", __name__)


@bp.get("/")
@bp.get("/auditions")
def react():
	if request.path == "/auditions":
		post = Post.query \
			.filter(or_(Post.type == "auditions")) \
			.join(Show, Post.show_id == Show.id) \
			.filter(Show.date > datetime.now()) \
			.order_by(Show.date.asc()) \
			.order_by(Post.date.desc()) \
			.first()
	else:
		post = Post.query \
			.filter(or_(Post.type == "public", Post.type == "auditions")) \
			.join(Show, Post.show_id == Show.id) \
			.filter(Show.date > datetime.now()) \
			.order_by(Show.date.asc()) \
			.order_by(Post.date.desc()) \
			.first()

	files = Files.query \
		.filter(Files.id.in_((post.linked_files or {}).get("files", [])))

	data = {
		'type': 'post',
		'title': post.title,
		'content': post.content,
		'files': [
			{'id': file.id, 'name': file.name} for file in files
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
				"cast": link.cast,
				"crew": link.crew
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
	show = Show.query.get(show_id)
	data = {
		"type": "past_show",
		"title": show.title,
		"show": {
			"id": show.id,
			"title": show.title,
			"subtitle": show.subtitle,
			"date": show.date.isoformat(),
			"season": show.season,
			"programme": show.programme or "",
			"author": show.author,
			"genre": show.genre,
			"show_type": show.show_type,
			"noda_review": show.noda_review,
			"text_blob": show.text_blob,
			"radio_audio": show.radio_audio
		},
		"photos": [[f"/photo/{photo.photo_url}", *photo.photo_desc.split(",")] for photo in show.show_photos],
		"cast": sorted([
			{
				"role": link.role_name,
				"id": link.member.id,
				"name": f"{link.member.firstname} {link.member.lastname}",
				"order": link.order_val,
			} for link in show.member_show_link if link.cast_or_crew == "cast"], key=lambda x: x.get("order") or 0),
		"crew": sorted([
			{
				"role": link.role_name,
				"id": link.member.id,
				"name": f"{link.member.firstname} {link.member.lastname}",
				"order": link.order_val,
			} for link in show.member_show_link if link.cast_or_crew == "crew"], key=lambda x: x.get("order") or 0),
	}
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


@bp.get("/search")
def react_search():
	posts = (Post.query
			.filter(Post.type.in_(["public", "auditions", "blog"]))
			.filter(Post.date<datetime.now())
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


@bp.errorhandler(401)
@bp.get("/members")
def react_members():
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


@bp.get("/sitedata")
def site_data():
	keys = [
		"site-name", "site_logo",
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
		output["next_show"] = {"title": db_next_show.title, "subtitle": db_next_show.subtitle}
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
	else:
		output["current_user"] = {
			"is_authenticated": False
		}

	return jsonify(output)


@bp.post("/cors")
def cors():
	data = request.json
	response = requests.get(data.get("url"))
	return response.text