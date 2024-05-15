import json
from datetime import datetime
from pprint import pprint
from sqlalchemy import or_

from flask import abort, Blueprint, make_response, redirect, jsonify, \
	render_template, Response, send_file, send_from_directory, url_for, request, session

from webapp.models import *
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
		return render_template(
			"react_template.html",
			data=data,
			css="frontpage.css"
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
		return render_template(
			"react_template.html",
			data=json.dumps(data),
			css="frontpage.css"
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
		return render_template(
			"react_template.html",
			data=json.dumps(data),
			css="frontpage.css"
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
				"href": f"/past-shows/m/{member.id}" if member.associated_user is None else f"/past-shows/u/{member.user.id}{user_duplicates.append(member.user.id) or ''}"
			}
			for member in members
			if (member.associated_user is None) or (member.user.id not in user_duplicates)
		] + [
			{
				"type": "show",
				"title": show.title,
				"href": f"/past-shows/{show.id}/{show.title}"
			}
			for show in shows
		]
	}
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		return render_template(
			"react_template.html",
			data=json.dumps(data),
			css="frontpage.css"
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
		output["last_show"] = {"title": db_latest_show.title, "link": f"/past-shows/{db_latest_show.id}", "photos": [f"/photo/{x.photo_url}" for x in ShowPhotos.query.filter_by(show_id=db_latest_show.id).order_by(ShowPhotos.photo_url.desc()).limit(5).all()]}
	return jsonify(output)
