import io
import pickle
from datetime import datetime

import dotmap
import mammoth as mammoth
from PIL import Image

from corha import corha
from flask import abort, flash, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import not_, or_

from webapp import app, db
from webapp.models import BlogImage, BlogPost, Files, KeyValue, Member, Post, Show, User, MemberShowLink as MSL
import json


class BlankShow:
	title = ""
	subtitle = ""
	genre = ""
	author = ""
	programme = ""
	gallery_link = ""


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
		new_post = Post(
			id=corha.rand_string(request.form.get("title"), 16, used_ids),
			type=request.form.get("type"),
			author=current_user.id,
			show_id=show_id,
			title=request.form.get("title"),
			content=request.form.get("content"),
			date=datetime.now()
		)

		db.session.add(new_post)
		db.session.commit()

		return redirect(f"/members/show/{show_id}")


@app.route("/members/manage-blog")
@login_required
def manage_blog():
	if current_user.is_authenticated:
		posts = []
		if current_user.role == "author":
			posts = BlogPost.query.filter_by(author=current_user.id).order_by(BlogPost.date.desc()).all()
		elif current_user.role == "admin":
			posts = BlogPost.query.order_by(BlogPost.date.desc()).all()
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
	used_ids = [value[0] for value in BlogPost.query.with_entities(BlogPost.id).all()]
	blog_id = corha.rand_string(datetime.utcnow().isoformat(), 16, used_ids)

	def convert_image(image, id=blog_id):
		img_count = BlogImage.query.filter_by(blog_id=id).count()
		sp_logo = BlogImage.query.get(("sitewide", 0)).image
		b = io.BytesIO()
		with image.open() as image_bytes:
			pil_image = Image.open(image_bytes, "r", None)
			pil_image = pil_image.convert('RGB')
			pil_image.save(b, "JPEG")
			b.seek(0)

		if b.read() == sp_logo:
			id = "sitewide"
			img_count = 0
		else:
			b.seek(0)
			new_img = BlogImage(
				blog_id=id,
				image_no=img_count,
				image=b.read()
			)
			db.session.add(new_img)
			db.session.commit()

		return {
			"src": f"/blog_img/{id}/{img_count}"
		}

	result = mammoth.convert_to_markdown(
		request.files.get('file'),
		convert_image=mammoth.images.img_element(convert_image))

	# modify markdown to match github style

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

	for i in range(len(markdown)):
		if markdown[i] not in [" ", "\n"]:
			markdown = markdown[i:]
			break

	post = BlogPost(**{
		"id": blog_id,
		"date": datetime.utcnow(),
		"title": request.files.get('file').filename.rstrip(".docx"),
		"content": markdown,
		"category": "blogpost",
		"author": current_user.id,
		"views": 0
	})
	db.session.add(post)
	db.session.commit()
	return make_response(blog_id, 200)


@app.route("/members/manage-blog/editor", methods=["GET", "POST"])
@login_required
def blog_editor():
	if request.method == "GET":
		if "new" in request.args.keys():
			used_ids = [value[0] for value in BlogPost.query.with_entities(BlogPost.id).all()]
			post = dotmap.DotMap({
				"id": corha.rand_string(datetime.utcnow().isoformat(), 16, used_ids),
				"date": datetime.utcnow(),
				"title": "",
				"content": ""
			})
		else:
			post = BlogPost.query.filter_by(id=request.args.get("post")).first_or_404()
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
			new_blogpost = BlogPost(
				id=request.form.get("id"),
				title=request.form.get("title"),
				date=request.form.get("date"),
				content=request.form.get("content"),
				category="blogpost",
				author=current_user.id,
				views=0
			)

			db.session.add(new_blogpost)
			db.session.commit()
		else:
			post = BlogPost.query.filter_by(id=request.args.get("id")).first_or_404()
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
	return render_template(
		"past_shows.html",
		manage_shows=True,
		shows=shows,
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

		MSL_ids = [value[0] for value in MSL.query.with_entities(MSL.id).all()]

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
				gallery_link=dic.get("gallery-link")
			)

			db.session.add(new_show)

			for msl_type in ["cast", "crew"]:
				form_roles = []

				for i in range(1, int(dic.get(msl_type + "_count")) + 1):
					role = dic.get(msl_type + "_roles" + str(i))
					if role != "":
						print(msl_type + "_members" + str(i))
						for j in dic.get(msl_type + "_members" + str(i)):
							form_roles.append((role, j,))

				for role in form_roles:
					new_role = MSL(
						id=(new_MSL_ID := corha.rand_string(dic["show-title"], 16, MSL_ids)),
						show_id=new_id,
						cast_or_crew=msl_type,
						role_name=role[0],
						member_id=role[1]
					)
					MSL_ids.append(new_MSL_ID)
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
			show.gallery_link = dic.get("gallery-link")

			for msl_type in ["cast", "crew"]:
				existing_roles = set([
					(r.role_name, r.member_id,)
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
								form_roles.append((role, j,))

				to_remove = existing_roles.difference(set(form_roles))
				to_add = set(form_roles).difference(existing_roles)

				for role in to_add:
					new_role = MSL(
						id=(new_MSL_ID := corha.rand_string(dic["show-title"], 16, MSL_ids)),
						show_id=show_id,
						cast_or_crew=msl_type,
						role_name=role[0],
						member_id=role[1]
					)

					MSL_ids.append(new_MSL_ID)
					db.session.add(new_role)

				for role in to_remove:
					MSL.query \
						.filter_by(
						show_id=show_id,
						cast_or_crew=msl_type,
						role_name=role[0],
						member_id=role[1]
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
		for key, value in request.form.items():
			KeyValue.query.filter_by(key=key).first().value = value

		db.session.commit()
		flash("Done!")

		return redirect(url_for("admin_settings"))


@app.route("/members/logout")
def logout():
	logout_user()
	return redirect(url_for("frontpage"))
