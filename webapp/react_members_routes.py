import io
from pprint import pprint
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import and_, case, column, extract, func, literal, not_, or_, sql, literal_column, union_all, text
from sqlalchemy.dialects.postgresql import aggregate_order_by

from webapp.models import MemberShowLink as MSL
from webapp.models import *

from flask import abort, Blueprint, flash, make_response, redirect, render_template, send_file, session, url_for, \
	request, jsonify
from flask_login import login_user, logout_user, current_user, login_required

bp = Blueprint("react_members_routes", __name__)


@bp.route("/members/dashboard")
@login_required
def react_dashboard():
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
	).scalar()

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


@bp.get("/members/post/<post_id>")
@login_required
def react_members_post(post_id):
	data = db.session.query(
		func.json_build_object(
			'type', 'post',
			'title', Post.title,
			'date', Post.date,
			'content', Post.content,
			'show_title', Show.title,
		)
	).join(Show, Post.show_id == Show.id).filter(
		Post.id == post_id
	).first()[0]

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.get("/members/show/<show_id>")
def react_members_show(show_id):
	results = db.session.query(
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
			),
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
		).order_by(Post.date.desc()).scalar_subquery().alias("posts"),
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

	print(show_details)

	data = {
		"type": "members_show",
		**results,
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


@bp.route("/file/<file_id>/<filename>", methods=["GET"])
@bp.route("/members/file/<file_id>/<filename>", methods=["GET"])
def file_direct(file_id, filename):
	"""member,author,admin"""
	if request.url_rule == "/file/<file_id>/<filename>":
		if "download" in request.args.keys():
			file = db.session.query(
				Files.name,
				Files.content
			).filter(
				Files.id == file_id,
				db.session.query(
					func.count(Post)
				).filter(
					Post.type != "private",
					Post.linked_files['files'].has_any([file_id])
				).scalar_subquery() >= 1
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
				db.session.query(
					func.count(Post)
				).filter(
					Post.type != "private",
					Post.linked_files['files'].has_any([file_id])
				).scalar_subquery() >= 1
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
