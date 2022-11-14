import io
from pprint import pprint

import dotmap
import json

import mammoth as mammoth
import requests
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime
from corha import corha

from flask import flash, make_response, redirect, render_template, send_file, session, url_for, \
	request  # , abort, session
from flask_login import logout_user, current_user, login_required  # , login_user
from sqlalchemy import func, not_, or_
from werkzeug.security import check_password_hash

from webapp import app, db
from webapp.models import BlogImage, BlogPost, Files, KeyValue, Member, Post, Show, ShowPhotos, User, \
	MemberShowLink as MSL
from webapp.photos_routes import manage_media


class BlankShow:
	title = ""
	subtitle = ""
	genre = ""
	author = ""
	programme = ""
	gallery_link = ""


@app.before_request
def force_password_change():
	if request.endpoint not in ["account_settings", "logout", "js", "css"]:
		if current_user.is_authenticated and session.get('set_password'):
			return redirect(url_for("account_settings", pwd="set"))


@app.route("/members/dashboard")
@login_required
def dashboard():
	posts = Post.query \
		.filter(or_(Post.type == "private", Post.type == "auditions")) \
		.join(Show, Post.show_id == Show.id) \
		.order_by(Post.date.desc()) \
		.with_entities(
			Post.id,
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle")
		) \
		.limit(10) \
		.all()

	return render_template(
		"members/dashboard.html",
		posts=posts,
		css="m_dashboard.css"
	)


@app.route("/members/post/<id>")
@login_required
def member_post(id):
	post = Post.query \
		.filter_by(id=id) \
		.join(User, Post.author == User.id) \
		.join(Show, Post.show_id == Show.id) \
		.with_entities(
			Post.id,
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle"),
			User.firstname,
			User.lastname
		) \
		.first_or_404()

	return render_template(
		"members/m_post.html",
		post=post,
		css="m_dashboard.css"
	)


@app.route("/members/show/<id>")
@login_required
def m_show(id):
	show = Show.query \
		.filter_by(id=id) \
		.first_or_404()

	posts = Post.query \
		.filter_by(show_id=id) \
		.filter(Post.type != "public") \
		.order_by(Post.date.desc()) \
		.all()

	files = Files.query \
		.filter_by(show_id=id) \
		.all()

	raw_producers = MSL.query\
		.filter_by(show_id=id, cast_or_crew="crew") \
		.filter(
			MSL.role_name.in_(["Director", "Producer"])
		).join(Member, MSL.member_id == Member.id)\
		.with_entities(Member.associated_user)\
		.filter(not_(Member.associated_user is None))\
		.all()

	producers = [value[0] for value in raw_producers]

	editors = User.query.filter(
		or_(
			User.role == "admin",
			User.id.in_(producers)
		)
	).all()

	return render_template(
		"members/show.html",
		editors=editors,
		show=show,
		posts=posts,
		files=files,
		css="m_dashboard.css"
	)


@app.route("/members/new_post/<show_id>", methods=["GET", "POST"])
@login_required
def new_post(show_id):
	if request.method == "GET":
		return render_template(
			"members/new_post.html",
			modules={
				"wysiwyg": True
			},
			css="m_dashboard.css"
		)
	else:
		used_ids = [value[0] for value in Post.query.with_entities(Post.id).all()]
		db_new_post = Post(
			id=corha.rand_string(request.form.get("title"), 16, used_ids),
			type=request.form.get("type"),
			author=current_user.id,
			show_id=show_id,
			title=request.form.get("title"),
			content=request.form.get("content"),
			date=datetime.now()
		)

		db.session.add(db_new_post)
		db.session.commit()

		return redirect(f"/members/show/{show_id}")


@app.route("/members/manage-blog")
@login_required
def manage_blog():
	if current_user.is_authenticated:
		posts = []
		if current_user.role == "author":
			# posts = BlogPost.query.filter_by(author=current_user.id).order_by(BlogPost.date.desc()).all()
			posts = Post.query.filter_by(type="blog", author=current_user.id).order_by(Post.date.desc()).all()
		elif current_user.role == "admin":
			posts = Post.query.filter_by(type="blog").order_by(Post.date.desc()).all()
		return render_template(
			"members/manage_blog.html",
			posts=posts,
			css="blog_manager.css",
			# js=["popup.js", "blog_manager.js"]
			js="blog_manager.js"
		)
	else:
		return redirect(url_for("login"))


@app.post("/members/manage-blog/upload")
@login_required
def upload_blog():
	def convert_image(image):
		b = io.BytesIO()
		with image.open() as image_bytes:
			pil_image = Image.open(image_bytes, "r", None)
			if (exif := pil_image._getexif()) is not None:
				orientation = exif.get(274)
			else:
				orientation = 1

			pil_image = pil_image.rotate(
				{1: 0, 2: 0, 3: 180, 4: 180, 5: 270, 6: 270, 7: 90, 8: 90}[orientation],
				expand=True
			)

			pil_image.save(b, "webp")
			b.seek(0)
		filename = "test.webp"

		x = manage_media(
			mammoth="true",
			image_name=filename,
			image=b
		)

		return {
			"alt": "test.webp",
			"src": x.get("path")
		}

	result = mammoth.convert_to_markdown(
		request.files.get('fileElem'),
		convert_image=mammoth.images.img_element(convert_image)
	)


	# modify markdown to match GitHub style

	# use ** to denote bold text rather than __
	markdown = result.value.replace("__", "**")
	# remove unnecessary character escaping
	markdown = markdown.replace("\\.", ".") \
		.replace("\\(", "(") \
		.replace("\\)", ")") \
		.replace("\\!", "!") \
		.replace("\\-", "-") \
		.replace("\\_", "_")
	# force https links
	markdown = markdown.replace("](http://", "](https://")
	# remove initial hr element
	markdown = markdown.replace("*** ***", "")
	# alt text new line workaround
	markdown = markdown.replace("\n", " ")
	# TODO implement alt_text replacement workaround

	for i in range(len(markdown)):
		if markdown[i] not in [" ", "\n"]:
			markdown = markdown[i:]
			break

	post = Post(**{
		"id": Post.get_new_id(),
		"date": datetime.utcnow(),
		"title": request.files.get('fileElem').filename.rstrip(".docx"),
		"content": markdown,
		"type": "blog",
		"author": current_user.id,
		"views": 0
	})
	db.session.add(post)
	db.session.commit()
	return make_response(post.id, 200)


@app.route("/members/manage-blog/editor", methods=["GET", "POST"])
@login_required
def blog_editor():
	if request.method == "GET":
		if "new" in request.args.keys():
			post = dotmap.DotMap({
				"id": Post.get_new_id(),
				"date": datetime.utcnow(),
				"title": "",
				"content": ""
			})
		else:
			# post = BlogPost.query.filter_by(id=request.args.get("post")).first_or_404()
			post = Post.query.filter_by(id=request.args.get("post")).first_or_404()
		return render_template(
			"members/blog_form.html",
			post=post,
			css="m_dashboard.css",
			modules={
				"wysiwyg": True,
				"tom-select": False
			}
			# js=js
		)
	else:
		if "new" in request.args.keys():
			new_blogpost = Post(
				id=request.form.get("id"),
				title=request.form.get("title"),
				date=request.form.get("date"),
				content=request.form.get("content"),
				type="blogpost",
				author=current_user.id,
				views=0
			)

			db.session.add(new_blogpost)
			db.session.commit()
		else:
			post = Post.query.filter_by(id=request.args.get("post")).first_or_404()
			post.title = request.form.get("title")
			post.date = request.form.get("date")
			post.content = request.form.get("content")

			db.session.commit()

		return redirect(url_for("manage_blog"))


@app.route("/members/file/<id>/<filename>", methods=["GET"])
@login_required
def file_direct(id, filename):
	file = Files.query \
		.filter_by(id=id, name=filename) \
		.first_or_404()

	return send_file(io.BytesIO(file.content), download_name=file.name)


@app.route("/members/upload_file/<show_id>", methods=["POST"])
@login_required
def file_upload(show_id):
	f = request.files.get('file')
	used_ids = [value[0] for value in Files.query.with_entities(Files.id).all()]
	new_file = Files(
		id=corha.rand_string(f.filename, 16, used_ids),
		show_id=show_id,
		name=f.filename,
		content=f.read()
	)
	db.session.add(new_file)
	db.session.commit()
	return redirect(f"/members/show/{show_id}")


@app.route("/members/file_delete/<file_id>/<filename>", methods=["GET"])
@login_required
def file_delete(file_id, filename):
	file = Files.query \
		.filter_by(id=file_id, name=filename) \
		.first_or_404()

	show_id = file.show_id

	db.session.delete(file)
	db.session.commit()
	flash("Done!")
	return redirect(f"/members/show/{show_id}")


@app.route("/members/manage-shows")
@login_required
def manage_shows():
	shows = Show.query.order_by(Show.date.desc()).all()
	photo_counts = ShowPhotos.query\
		.with_entities(ShowPhotos.show_id, func.count(ShowPhotos.show_id)) \
		.group_by(ShowPhotos.show_id).all()
	# print(photo_counts)

	return render_template(
		"past_shows.html",
		manage_shows=True,
		shows=shows,
		photo_counts=dict(photo_counts),
		css="past_shows.css",
		js="past_shows.js"
	)


@app.route("/members/edit-show/<show_id>", methods=["GET", "POST"])
@login_required
def edit_show(show_id):
	if request.method == "GET":
		if show_id != "new":
			show = Show.query.filter_by(id=show_id).first_or_404()
			prefill_members = {"cast": {}, "crew": {}}

			raw_msl = MSL.query \
				.filter_by(show_id=show_id) \
				.with_entities(
					MSL.cast_or_crew,
					MSL.role_name,
					MSL.member_id
				) \
				.order_by(MSL.order_val) \
				.all()
			for member in raw_msl:
				prefill_members[member.cast_or_crew].setdefault(member.role_name, []).append(member.member_id)

		else:
			show = Show()
			prefill_members = ""

		members = Member.query.all()
		crew_roles = MSL.query \
			.filter_by(cast_or_crew="crew") \
			.with_entities(MSL.role_name) \
			.distinct() \
			.order_by(MSL.order_val) \
			.all()

		modules = {
			"wysiwyg": True,
			"tom-select": True
		}
		return render_template(
			"members/edit_show.html",
			show=show,
			members=members,
			crew_roles=crew_roles,
			prefill_members=json.dumps(prefill_members, separators=(',', ':')),
			css="edit_show.css",
			js="past_show_form.js",
			modules=modules
		)
	elif request.method == "POST":
		dic = {
			key.rstrip('[]'):
				request.form.getlist(key)
				if key.endswith('[]')
				else
				request.form.get(key)
			for key in request.form.keys()
		}

		msl_ids = [value[0] for value in MSL.query.with_entities(MSL.id).all()]

		if show_id == "new":
			used_ids = [value[0] for value in Show.query.with_entities(Show.id).all()]
			new_id = corha.rand_string(dic["show-title"], 16, used_ids)

			new_show = Show(
				id=new_id,
				date=dic.get("last-perf"),
				season=dic.get("season"),
				show_type=dic.get("show-type"),
				title=dic.get("show-title"),
				subtitle=dic.get("show-subtitle"),
				genre=dic.get("genre"),
				author=dic.get("show-author"),
				programme=dic.get("programme-img"),
				text_blob=dic.get("text_blob")
			)

			db.session.add(new_show)

			for msl_type in ["cast", "crew"]:
				form_roles = []

				for i in range(1, int(dic.get(msl_type + "_count")) + 1):
					role = dic.get(msl_type + "_roles" + str(i))
					if role != "":
						print(msl_type + "_members" + str(i))
						for j in dic.get(msl_type + "_members" + str(i)):
							form_roles.append((role, j, i,))

				for role in form_roles:
					new_role = MSL(
						id=(new_MSL_ID := corha.rand_string(dic["show-title"], 16, msl_ids)),
						show_id=new_id,
						cast_or_crew=msl_type,
						role_name=role[0],
						member_id=role[1],
						order_val=role[2]
					)
					msl_ids.append(new_MSL_ID)
					db.session.add(new_role)

			db.session.commit()
		else:
			show = Show.query.filter_by(id=show_id).first_or_404()
			show.date = dic.get("last-perf")
			show.season = dic.get("season")
			show.show_type = dic.get("show-type")
			show.title = dic.get("show-title")
			show.subtitle = dic.get("show-subtitle")
			show.genre = dic.get("genre")
			show.author = dic.get("show-author")
			show.programme = dic.get("programme-img")
			show.text_blob = dic.get("text_blob")

			for msl_type in ["cast", "crew"]:
				existing_roles = set([
					(r.role_name, r.member_id, r.order_val)
					for r in MSL.query.filter_by(
						show_id=show_id,
						cast_or_crew=msl_type
					)
				])

				form_roles = []
				try:
					count = int(dic.get(msl_type + "_count"))
				except ValueError:
					count = 0

				for i in range(1, count + 1):
					role = dic.get(msl_type + "_roles" + str(i))
					if role != "":
						print(msl_type + "_members" + str(i))
						if (members := dic.get(msl_type + "_members" + str(i))) is not None:
							for j in members:
								form_roles.append((role, j, i,))

				to_remove = existing_roles.difference(set(form_roles))
				to_add = set(form_roles).difference(existing_roles)

				for role in to_add:
					new_role = MSL(
						id=(new_MSL_ID := corha.rand_string(dic["show-title"], 16, msl_ids)),
						show_id=show_id,
						cast_or_crew=msl_type,
						role_name=role[0],
						member_id=role[1],
						order_val=role[2]
					)

					msl_ids.append(new_MSL_ID)
					db.session.add(new_role)

				for role in to_remove:
					MSL.query \
						.filter_by(
							show_id=show_id,
							cast_or_crew=msl_type,
							role_name=role[0],
							member_id=role[1],
							order_val=role[2]
						) \
						.delete()

			db.session.commit()

		return redirect(url_for("manage_shows"))


@app.route("/members/add-show-member", methods=["GET", "POST"])
@login_required
def add_show_member():
	if request.method == "GET":
		members = Member.query.all()
		return render_template(
			"members/add_show_member.html",
			members=members,
			css="add_new_members.css"
		)
	elif request.method == "POST":
		if "bulk" in request.form.keys():
			new_members = list(map(lambda x: x.split("\t"), request.form["bulk"].split("\r\n")))
			for member in new_members:
				new_member = Member(
					id=Member.get_new_id(),
					firstname=member[0],
					lastname=member[1]
				)
				db.session.add(new_member)
		else:
			used_ids = [value[0] for value in Member.query.with_entities(Member.id).all()]
			new_id = corha.rand_string(request.form["firstname"], 16, used_ids)

			new_member = Member(
				id=new_id,
				firstname=request.form['firstname'],
				lastname=request.form['lastname']
			)

			db.session.add(new_member)

		db.session.commit()

		return redirect(url_for("add_show_member"))


@app.route("/members/manage_users", methods=["GET", "POST"])
def manage_users():
	if request.method == "GET":
		user = None
		if "u" in request.args.keys():
			user = User.query\
				.filter_by(id=request.args.get("u"))\
				.with_entities(
					User.id,
					User.email
				)\
				.first_or_404()
		return render_template(
			"members/manage_users.html",
			user=user,
			css="m_dashboard.css"
		)
	else:
		new_id = User.get_new_id()
		new_user = User(
			id=new_id,
			firstname=request.form.get("firstname"),
			lastname=request.form.get("lastname"),
			email=request.form.get("email"),
			role=request.form.get("role"),
			password=new_id
		)
		db.session.add(new_user)
		db.session.commit()

		return redirect(url_for("manage_users", u=new_id))


@app.route("/members/admin_settings", methods=["GET", "POST"])
@login_required
def admin_settings():
	if request.method == "GET":
		settings_dict = {
			i.key: i.value
			for i in KeyValue.query.all()
		}

		return render_template(
			"members/admin_settings.html",
			settings_dict=settings_dict,
			css="m_dashboard.css"
		)
	else:
		# print(dict(request.form.items()))
		for key, value in request.form.items():
			KeyValue.query.filter_by(key=key).first().value = value

		db.session.commit()
		flash("Done!")

		return redirect(url_for("admin_settings"))


@app.route("/members/account_settings", methods=["GET", "POST"])
@login_required
def account_settings():
	if request.method == "GET":
		return render_template(
			"members/account_settings.html",
			css="account_settings.css"
		)
	else:
		error = "success"
		# password changing logic
		if request.form.get("submit") == "Change Password":
			if current_user.verify_password(request.form.get('old_password')):
				if request.form.get('new_password') == request.form.get('confirm_new_password'):
					current_user.password = request.form.get('new_password')
					db.session.commit()
					session['set_password'] = False
				else:
					error = "confirm_new_password"
			else:
				error = "old_password"

		# TODO: add 2 factor setup menu

		return redirect(url_for("account_settings", e=error))


@app.route("/members/logout")
def logout():
	logout_user()
	return redirect(url_for("frontpage"))
