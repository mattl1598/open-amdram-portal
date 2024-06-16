import base64
import collections
import csv
import io
import re
import uuid

import smaz
from pprint import pprint

import distinctipy as distinctipy
import dotmap
import json

import mammoth as mammoth
import pyotp
import requests
import tld as tld
from PIL import Image
from datetime import timedelta  # , datetime
from dateutil.relativedelta import relativedelta

from flask import abort, Blueprint, flash, make_response, redirect, render_template, send_file, session, url_for, \
	request, jsonify
from flask_login import login_user, logout_user, current_user, login_required
# noinspection PyPackageRequirements
from sqlalchemy import and_, extract, func, not_, or_, sql
from sqlalchemy.dialects.postgresql import array
from flask import current_app as app

# noinspection PyPep8Naming
from webapp.models import MemberShowLink as MSL
from webapp.models import *
from webapp.photos_routes import manage_media, update_access_token

bp = Blueprint("members_routes", __name__)


class BlankShow:
	title = ""
	subtitle = ""
	genre = ""
	author = ""
	programme = ""
	gallery_link = ""


class MemberPost:
	date = datetime
	# noinspection PyPep8
	icon_set = {
		"doc":
		'<path d="M29 4H12A4 4 0 0 0 8 8V42A4 4 0 0 0 12 46H38A4 4 0 0 0 42 42V17L29 4M32 42H29L25 27 21 42H18L14 '
		'23H17L20 37 24 23H26L30 37 33 23H36L32 42M27 19V7L39 19H27Z"/>',
		"pdf":
		'<path d="M26.25 25.625H22.083V32.292H26.458C27.708 32.292 28.333 31.875 28.958 31.25 29.583 30.625 '
		'29.792 30 29.792 28.958 29.792 27.917 29.583 27.292 28.958 26.667 28.333 26.042 27.5 25.625 26.25 '
		'25.625M29.167 4.167H12.5A4.167 4.167 0 0 0 8.333 8.333V41.667A4.167 4.167 0 0 0 12.5 '
		'45.833H37.5A4.167 4.167 0 0 0 41.667 41.667V16.667L29.167 4.167M31.667 33.333C30.417 34.375 29.375 '
		'34.792 26.667 34.792H22.083V41.667H18.75V22.917H26.667C29.375 22.917 30.625 23.542 31.667 24.583 '
		'32.917 25.833 33.333 27.083 33.333 28.958 33.333 30.833 32.917 32.292 31.667 33.333M27.083 '
		'18.75V7.292L38.542 18.75H27.083Z"/>',
		"xlsx":
		'<path d="m29 4h-17a4 4 0 0 0-4 4v33a4 4 0 0 0 4 4h25a4 4 0 0 0 4-4v-25l-12-12m4 37h-4l-4-7-4 '
		'7h-4l6-9-6-9h4l4 7 4-7h4l-6 9 6 9m-6-23v-11l11 11h-11z"/>',
		"file":
		'<path d="M27 19V7L39 19M12 4C10 4 8 6 8 8V42A4 4 0 0 0 12 46H37A4 4 0 0 0 42 42V17L29 4H12Z"/>',
		"post":
		'<path d="M42 17 25 27 8 17V13L25 23 42 13M42 8H8C6 8 4 10 4 13V38A4 4 0 0 0 8 42H42A4 4 0 0 0 46 '
		'38V13C46 10 44 8 42 8Z"/>',
		"msg":
		'<path d="M27 23H23V10H27M27 31H23V27H27M42 4H8C6 4 4 6 4 8V46L12 38H42C44 38 46 36 46 33V8C46 6 44 '
		'4 42 4Z"/> '
	}

	def __init__(self, post_id="", title="", date=datetime.utcnow(), show_title="", post_type="", text="", link=""):
		self.id = post_id
		self.title = title
		self.date = date
		if post_type == "file":
			self.link = f"/members/{post_type}/{post_id}/{title}"
		elif post_type == "link":
			self.link = link
		else:
			self.link = f"/members/{post_type}/{post_id}"
		self.show_title = show_title
		self.type = post_type

		if self.type == 'file':
			ext = self.title.lower().rsplit(".", 1)[1]
			# self.icon = self.icon_set["file"]
			self.icon = "file"
			for key in self.icon_set.keys():
				if key in ext:
					# self.icon = self.icon_set[key]
					self.icon = key
					break

			self.text = f"{ext.upper()} file"
		else:
			# self.icon = self.icon_set["msg"]
			self.icon = "msg"
			self.text = text

	def __repr__(self):
		return f"DashboardPost('{self.id}', '{self.title}', '{self.date}', '{self.link}', '{self.show_title}', '{self.type}')"


@bp.before_request
def force_password_change():
	if request.endpoint not in ["members_routes.account_settings", "routes.logout", "routes.js", "routes.css"]:
		if current_user.is_authenticated and session.get('set_password'):
			return redirect(url_for("members_routes.account_settings"))


# noinspection PyUnresolvedReferences
# @bp.route("/members/dashboard")
# @login_required
def dashboard():
	"""member,author,admin"""
	actions = []
	if not (current_user.e_con_name and current_user.e_con_phone):
		actions.append({
			"icon": "important", "link": url_for("members_routes.account_settings"), "date": datetime.utcnow(),
			"title_text": "Add Emergency Contact", "body_text": "Click to Update your Emergency Contact Details"
		})
	current_date = datetime.now()
	# Calculate the most recent July 1st that has passed
	if current_date.month > 7 or (current_date.month == 7 and current_date.day >= 1):
		most_recent_july_1st = datetime(current_date.year, 7, 1)
	else:
		most_recent_july_1st = datetime(current_date.year - 1, 7, 1)
	# Get the datestamp for midnight on the most recent July 1st
	midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)
	if not SubsPayment.query.filter_by(user_id=current_user.id).filter(SubsPayment.datetime > midnight_july_1st).count():
		actions.append({
			"icon": "important", "link": url_for("members_routes.pay_subs"), "date": datetime.utcnow(),
			"title_text": "Renew Membership", "body_text": "Click to renew your membership."
		})

	posts = Post.query \
		.filter(
			or_(
				Post.type == "private",
				Post.type == "auditions"
			),
			Post.date > datetime.utcnow() - relativedelta(months=2)
		) \
		.join(Show, Post.show_id == Show.id) \
		.order_by(Post.date.desc()) \
		.with_entities(
			Post.id,
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle"),
			sql.expression.literal_column("'post'").label("type")
		) \
		.all()

	files = Files.query \
		.filter(Files.date > datetime.utcnow() - relativedelta(months=2)) \
		.join(Show, Files.show_id == Show.id) \
		.order_by(Files.date.desc()) \
		.with_entities(
			Files.id,
			Files.name.label("title"),
			Files.date,
			sql.expression.literal_column("'file'").label("content"),
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle"),
			sql.expression.literal_column("'file'").label("type")
		) \
		.all()

	dash_posts = sorted(
		[MemberPost(i.id, i.title, i.date, i.show_title, i.type, i.content) for i in [*posts, *files]],
		key=lambda x: x.date,
		reverse=True
	)

	return render_template(
		"members/dashboard.html",
		posts=dash_posts,
		actions=actions,
		css="m_dashboard.css"
	)


# noinspection PyUnresolvedReferences
# @bp.route("/members/post/<post_id>")
# @login_required
def member_post(post_id):
	"""member,author,admin"""
	post = Post.query \
		.filter_by(id=post_id) \
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


# @bp.route("/members/shows")
# @login_required
def m_shows():
	"""member,author,admin"""
	shows = []
	for show in Show.query.order_by(Show.date.desc()).all():
		dir_prod = [
			f"{link.firstname} {link.lastname}"
			for link in MSL.query
			.filter_by(show_id=show.id)
			.join(Member, Member.id == MSL.member_id)
			.filter(
				or_(
					MSL.role_name == "Director",
					MSL.role_name == "Producer"
				)
			)
			.order_by(MSL.role_name)
			.with_entities(MSL.role_name, Member.firstname, Member.lastname)
			.all()
		]

		shows.append(
			(
				show.title,
				show.season,
				show.date.year,
				show.programme,
				", ".join(dir_prod),
				show.id
			)
		)
	return render_template(
		"members/shows.html",
		shows=shows,
		css="m_shows.css"
	)


# noinspection PyUnresolvedReferences
# @bp.route("/members/show/<show_id>")
# @login_required
def m_show(show_id):
	"""member,author,admin"""
	show = Show.query \
		.filter_by(id=show_id) \
		.first_or_404()

	db_posts = Post.query \
		.filter_by(show_id=show_id) \
		.order_by(Post.date.desc()) \
		.all()
	# .filter(Post.type != "public") \

	db_files = Files.query \
		.filter_by(show_id=show_id) \
		.all()

	raw_producers = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="crew") \
		.filter(
			MSL.role_name.in_(["Director", "Producer"])
		).join(Member, MSL.member_id == Member.id) \
		.with_entities(Member.associated_user) \
		.filter(not_(Member.associated_user is None)) \
		.all()

	producers = [value[0] for value in raw_producers]

	editors = User.query.filter(
		or_(
			User.role == "admin",
			User.id.in_(producers)
		)
	).all()

	posts = [
			MemberPost(
				post_id=i.id,
				title=i.title,
				date=i.date,
				post_type="post",
				text=i.content
			) for i in db_posts
		]

	files = [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in db_files
		]

	return render_template(
		"members/show.html",
		editors=editors,
		show=show,
		posts=posts,
		files=files,
		css="m_dashboard.css"
	)


@bp.route("/members/emergency_contacts/<show_id>")
@login_required
def emergency_contacts(show_id):
	"""member,author,admin"""
	show = Show.query.get_or_404(show_id)
	permissions = MSL.query.join(Member, MSL.member_id == Member.id)\
		.filter(
			Member.associated_user == current_user.id,
			MSL.role_name.in_(["Director", "Producer"]),
			MSL.show_id == show_id
		).count()
	if current_user.role != "admin" and not permissions:
		abort(403)

	if webhook := KeyValue.query.get("alerts_webhook"):
		url = webhook.value
		data = {
			"content": "",
			"embeds": [
				{
					"type": "rich",
					"title": "Emergency Contact",
					"description":
					f"User: {current_user.firstname} {current_user.lastname} ({current_user.email}) \n"
					f"accessed Emergency Contact details for {show.title} ({show.date.year})",
					"color": 0xcd4a46,
					"url": "https://silchesterplayers.org",
				}
			],
			"type": 1
		}
		headers = {'Content-type': 'application/json'}  # NEEDS TO BE JSON NOT JUST A RAW DICTIONARY WHYYYYYY
		requests.post(url=url, data=json.dumps(data), headers=headers)

	users = User.query\
		.filter(
			User.email.is_not(None),
			not_(User.email.ilike("%@example.com%"))
		).all()
	return render_template(
		"members/emergency_contacts.html",
		css="emergency_contacts.css",
		js="quicksearch.js",
		users=users
	)


@bp.route("/members/new_post/<show_id>", methods=["GET", "POST"])
@login_required
def new_post(show_id):
	"""member,author,admin"""
	Show.query.filter_by(id=show_id).first_or_404()
	draft = json.loads(
		smaz.decompress(
			base64.urlsafe_b64decode(
				(request.args.get("d") or '_wF7fQ<<').replace("<", "=").encode("ascii")
			)
		)
	)
	if request.method == "GET":
		media_db = StaticMedia.query.order_by(StaticMedia.date.desc()).all()

		if media_db:
			media_ids = {
				f"{x.item_id}": f"{x.id}"
				for x in media_db
			}

			update_access_token()

			url = f"https://photoslibrary.googleapis.com/v1/mediaItems:batchGet?mediaItemIds="
			url += f"{'&mediaItemIds='.join(media_ids.keys())}"
			url += f"&access_token={session.get('access_token')}"

			x = requests.get(url)

			thumbs = [
				(
					media_ids[i["mediaItem"]["id"]],
					f'{i["mediaItem"]["baseUrl"]}=d',
					i["mediaItem"]["filename"],
				)
				for i in x.json()["mediaItemResults"]
			]

		else:
			thumbs = []

		available_files = [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in Files.query \
				.filter_by(show_id=show_id) \
				.filter(not_(Files.id.in_(draft.get("files") or []))) \
				.all()
		]

		chosen_files = [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in Files.query \
				.filter_by(show_id=show_id) \
				.filter(
					Files.id.in_(draft.get("files") or [])
				).all()
		]

		return render_template(
			"members/new_post.html",
			draft=draft,
			media=thumbs,
			available_files=available_files,
			chosen_files=chosen_files,
			js="new_post.js",
			modules={
				"wysiwyg": True
			},
			css="m_dashboard.css"
		)
	else:
		if request.form.get("submit") == "Submit":
			db_new_post = Post(
				id=Post.get_new_id(),
				type=request.form.get("type"),
				author=current_user.id,
				show_id=show_id,
				title=request.form.get("title"),
				content=request.form.get("content"),
				date=datetime.now(),
				linked_files={"files": json.loads(request.form.get("selected_files"))}
			)

			db.session.add(db_new_post)
			db.session.commit()

			return redirect(f"/members/show/{show_id}")
		elif request.form.get("submit") == "Add File":
			if new_file := request.files.get("new_file"):
				file_id = file_upload(show_id, file=new_file)
			elif request.form.get("select_file"):
				file_id = request.form.get("select_file")
			else:
				return redirect(url_for("members_routes.new_post", show_id=show_id, d=draft))
			updated_draft = {
				"title": request.form.get("title"),
				"type": request.form.get("type"),
				"content": request.form.get("content"),
				"files": json.loads(request.form.get("selected_files")) + [file_id]
			}
			url_draft = base64.urlsafe_b64encode(smaz.compress(json.dumps(updated_draft))).decode("ascii").replace("=", "<")

			return redirect(url_for("members_routes.new_post", show_id=show_id, d=url_draft))


@bp.route("/members/docs")
@login_required
def member_docs():
	"""member,author,admin"""
	if current_user.is_authenticated:
		files = [
			MemberPost(
				title="Adult Membership Subs",
				date=datetime.utcnow(),
				text="Click to Pay",
				link="https://checkout.square.site/buy/2RAQ4QC2TWDCTY6WTQSAXZHG",
				post_type="link"
			),
			MemberPost(
				title="Junior Membership Subs",
				date=datetime.utcnow(),
				text="Click to Pay",
				link="https://checkout.square.site/buy/PMRGF2GUVKGHNFZCOJMQQKXT",
				post_type="link"
			)
		] + [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in Files.query.filter_by(show_id="members_public").all()
		]

		return render_template(
			"members/temp_member_docs.html",
			files=files,
			css=["members.css", "m_dashboard.css"]
		)


@bp.route("/members/manage-blog")
@login_required
def manage_blog():
	"""author,admin"""
	if current_user.is_authenticated:
		if current_user.role not in ["author", "admin"]:
			abort(403)
		posts = []
		if current_user.role == "author":
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
		abort(405)


@bp.post("/members/manage-blog/upload")
@login_required
def upload_blog():
	"""author,admin"""
	def convert_image(image):
		b = io.BytesIO()
		with image.open() as image_bytes:
			pil_image = Image.open(image_bytes, "r", None)
			if (exif := pil_image.getexif()) is not None:
				orientation = exif.get(274)
			else:
				orientation = 1

			pil_image = pil_image.rotate(
				{1: 0, 2: 0, 3: 180, 4: 180, 5: 270, 6: 270, 7: 90, 8: 90}.get(orientation) or 0,
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


@bp.route("/members/manage-blog/editor", methods=["GET", "POST"])
@login_required
def blog_editor():
	"""author,admin"""
	if current_user.role not in ["author", "admin"]:
		abort(403)
	if request.method == "GET":
		if "new" in request.args.keys() or list(request.args.keys()) == []:
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

		return redirect(url_for("members_routes.manage_blog"))


# @bp.route("/file/<file_id>/<filename>", methods=["GET"])
# @bp.route("/members/file/<file_id>/<filename>", methods=["GET"])
def file_direct(file_id, filename):
	"""member,author,admin"""
	file = Files.query \
		.filter_by(id=file_id, name=filename.replace("_", " ")) \
		.first()

	# Test fudging
	class FakeFile:
		def __init__(self, show_id, found, id):
			self.show_id = show_id
			self.id = id
			self.found = found

	if file is None:
		file = FakeFile("", False, "")
	else:
		file.found = True


	count = 1
	if request.url_rule == "/file/<file_id>/<filename>":
		count = db.session.query(
			func.count(Post)
		).filter(
			Post.type != "private",
			Post.linked_files['files'].has_any([file_id])
		)

	if current_user.is_authenticated or file.show_id == "members_public" or count:
		if file.found:
			return send_file(io.BytesIO(file.content), download_name=file.name)
		else:
			abort(404)
	else:
		flash("Please log in to access this resource.")
		# return redirect(url_for("routes.members"))
		abort(401)


@bp.route("/members/upload_file/<show_id>", methods=["POST"])
@login_required
def file_upload(show_id, **kwargs):
	"""member,author,admin"""
	if kwargs.get("file"):
		f = kwargs.get("file")
	else:
		f = request.files.get('file')
	if f.filename:
		new_file = Files(
			id=Files.get_new_id(),
			show_id=show_id,
			name=f.filename,
			content=f.read()
		)
		db.session.add(new_file)
		db.session.commit()

		if kwargs.get("file"):
			return new_file.id
		else:
			return redirect(f"/members/show/{show_id}")


@bp.route("/members/file_delete/<file_id>/<filename>", methods=["GET"])
@login_required
def file_delete(file_id, filename):
	"""member,author,admin"""
	file = Files.query \
		.filter_by(id=file_id, name=filename) \
		.first_or_404()

	show_id = file.show_id

	db.session.delete(file)
	db.session.commit()
	flash("Done!")
	return redirect(f"/members/show/{show_id}")


@bp.get("/members/csv")
@login_required
def csv_download():
	"""admin"""
	if current_user.role == "admin":
		table = request.args.get("table")
		if table == "shows":
			valid = True
			model = Show
			data = model.query.order_by(Show.date.desc()).all()
		elif table == "members":
			valid = True
			model = Member
			# noinspection PyUnresolvedReferences
			data = model.query.order_by(Member.lastname.asc()).all()
		elif table == "roles":
			valid = True
			model = MSL
			# noinspection PyUnresolvedReferences
			data = model.query \
				.order_by(MSL.show_id.asc()) \
				.order_by(MSL.cast_or_crew.asc()) \
				.order_by(MSL.order_val.asc()) \
				.all()
		else:
			abort(404)
			return

		if valid:
			file = io.StringIO()
			outcsv = csv.writer(file)
			# noinspection PyUnresolvedReferences
			headings = [heading.name for heading in model.__mapper__.columns]
			outcsv.writerow(headings)
			# noinspection PyUnresolvedReferences
			[outcsv.writerow([getattr(curr, column.name) for column in model.__mapper__.columns]) for curr in data]
			response = make_response(file.getvalue())
			response.headers["Content-Disposition"] = f'attachment; filename="{table}.csv'
			file.close()

			return response
	else:
		abort(403)


@bp.route("/members/admin/manage-shows")
@login_required
def manage_shows():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	shows = Show.query.order_by(Show.date.desc()).all()
	photo_counts = ShowPhotos.query \
		.with_entities(ShowPhotos.show_id, func.count(ShowPhotos.show_id)) \
		.group_by(ShowPhotos.show_id).all()

	return render_template(
		"past_shows.html",
		manage_shows=True,
		shows=shows,
		photo_counts=dict(photo_counts),
		css="past_shows.css",
		js=["past_shows.js", "quicksearch.js"]
	)


@bp.route("/members/edit-show/<show_id>", methods=["GET", "POST"])
@login_required
def edit_show(show_id):
	"""admin"""
	if current_user.role != "admin":
		abort(403)
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
			new_id = Show.get_new_id()
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
				text_blob=dic.get("text_blob"),
				noda_review=dic.get("noda-review")
			)

			db.session.add(new_show)

			for msl_type in ["cast", "crew"]:
				form_roles = []

				for i in range(1, int(dic.get(msl_type + "_count")) + 1):
					role = dic.get(msl_type + "_roles" + str(i))
					if role != "":
						# print(msl_type + "_members" + str(i))
						for j in dic.get(msl_type + "_members" + str(i)):
							form_roles.append((role, j, i,))

				for role in form_roles:
					new_role = MSL(
						id=(new_MSL_ID := corha.rand_string(dic["show-title"], 16, msl_ids)),
						show_id=new_show.id,
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
			show.noda_review = dic.get("noda-review")

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
						# print(msl_type + "_members" + str(i))
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

		return redirect(url_for("members_routes.manage_shows"))


@bp.route("/members/admin/add-show-member", methods=["GET", "POST"])
@login_required
def add_show_member():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	if request.method == "GET":
		members = Member.query.all()[::-1]
		return render_template(
			"members/add_show_member.html",
			title="Add New Members",
			members=members,
			css="add_new_members.css"
		)
	elif request.method == "POST":
		existing = [(i.firstname, i.lastname) for i in Member.query.all()]
		if "bulk" in request.form.keys():
			new_members = list(map(lambda x: x.split("\t"), request.form["bulk"].split("\r\n")))
			# pprint(new_members)
			valid = 0
			for member in new_members:
				if member != [''] and (member[0], member[1]) not in existing:
					new_member = Member(
						id=Member.get_new_id(),
						firstname=member[0],
						lastname=member[1]
					)
					db.session.add(new_member)
					valid += 1
			flash(f"{len(new_members)} names submitted, {valid} members added.")
		elif "bulk-roles" in request.form.keys():
			existing = [(i.show_id, i.cast_or_crew, i.role_name, i.member_id) for i in MSL.query.all()]
			new_roles = list(map(lambda x: x.split("\t"), request.form["bulk-roles"].split("\r\n")))
			# pprint(new_roles)
			valid = 0
			for role in new_roles:
				if len(role) == 5 and (role[0], role[1].lower(), role[2], role[3]) not in existing:
					new_link = MSL(
						id=MSL.get_new_id(),
						show_id=role[0],
						cast_or_crew=role[1].lower(),
						role_name=role[2],
						member_id=role[3],
						order_val=int(role[4] or 0)
					)
					# print(new_link)
					db.session.add(new_link)
					valid += 1
			flash(f"{len(new_roles)} roles submitted, {valid} roles added.")
		elif "api" in request.args.keys():
			json_data = request.get_json()
			# Extract the first and last name from the JSON data
			first_name = json_data["firstName"]
			last_name = json_data["lastName"]
			if (first_name, last_name) not in existing:
				new_member = Member(
					id=Member.get_new_id(),
					firstname=first_name,
					lastname=last_name
				)
				db.session.add(new_member)
				db.session.commit()
				return jsonify({"id": new_member.id})
			else:
				abort(400)
		else:
			used_ids = [value[0] for value in Member.query.with_entities(Member.id).all()]
			new_id = corha.rand_string(request.form["firstname"], 16, used_ids)
			if (request.form['firstname'], request.form['lastname']) not in existing:
				new_member = Member(
					id=new_id,
					firstname=request.form['firstname'],
					lastname=request.form['lastname']
				)
				db.session.add(new_member)

		db.session.commit()

		return redirect(url_for("members_routes.add_show_member"))


@bp.route("/members/admin/manage_users", methods=["GET", "POST"])
@login_required
def manage_users():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	if request.method == "GET":
		user = None
		if "u" in request.args.keys():
			user = User.query \
				.filter_by(id=request.args.get("u")) \
				.first_or_404()
		all_users = User.query\
			.filter(
				User.email.is_not(None),
				User.firstname != "Test"
			).with_entities(
				User.id,
				User.firstname,
				User.lastname,
				User.email,
				User.role
			)\
			.all()
		all_users += User.query\
			.filter(
				User.email.is_not(None),
				User.firstname == "Test"
			).with_entities(
				User.id,
				User.firstname,
				User.lastname,
				User.email,
				User.role
			)\
			.all()
		return render_template(
			"members/manage_users.html",
			user=user,
			users=all_users,
			css="manage_users.css",
			js="manage_users.js"
		)
	else:
		if request.args.get("form") == "invite":
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
			return redirect(url_for("members_routes.manage_users", u=new_id))
		elif request.args.get("form") == "role":
			user = User.query.filter_by(id=request.json.get("userId")).first_or_404()
			user.role = request.json.get("newRole")
			db.session.commit()
			return jsonify(200)
		elif request.args.get("form") == "pswd":
			user = User.query.filter_by(id=request.json.get("userId")).first_or_404()
			user.password = user.id
			db.session.commit()
			return jsonify(200)


@bp.route("/members/admin")
@login_required
def admin_tools():
	"""admin"""
	if current_user.role != "admin":
		abort(403)

	return render_template(
		"members/admin.html",
		css="m_dashboard.css"
	)


@bp.route("/members/admin/admin_settings", methods=["GET", "POST"])
@login_required
def admin_settings():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
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
		flash("Settings Successfully Updated")

		return redirect(url_for("members_routes.admin_settings"))


@bp.route("/members/account_settings", methods=["GET", "POST"])
@login_required
def account_settings():
	"""member,author,admin"""
	error = ""
	if request.method == "GET":
		if not (key := current_user.otp_secret):
			key = pyotp.random_base32()
		totp = pyotp.totp.TOTP(key)
		otp_qr = totp.provisioning_uri(name=current_user.email, issuer_name='Silchester Players Members')
		subs_result = SubsPayment.query.filter_by(user_id=current_user.id).order_by(SubsPayment.datetime.desc()).first()
		current_date = datetime.now()
		# Calculate the most recent July 1st that has passed
		if current_date.month > 7 or (current_date.month == 7 and current_date.day >= 1):
			most_recent_july_1st = datetime(current_date.year, 7, 1)
		else:
			most_recent_july_1st = datetime(current_date.year - 1, 7, 1)
		# Get the datestamp for midnight on the most recent July 1st
		midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)
		if subs_result:
			day = int(subs_result.datetime.strftime("%d"))
			suffix = [["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][int(str(day)[-1])], "th"][14 > day > 10]
			date = f"{day}{suffix}"
			date += subs_result.datetime.strftime(" %B %Y")
			last_payment = {
				"exists": True,
				"level": subs_result.membership_type,
				"date": date,
				"due": midnight_july_1st > subs_result.datetime
			}
		else:
			last_payment = {"exists": False}

		return render_template(
			"members/account_settings.html",
			otp_qr=otp_qr,
			last_payment=last_payment,
			css="account_settings.css"
		)
	else:
		# password changing logic
		if request.form.get("submit") == "Change Password":
			error = "pwd_success"
			if current_user.verify_password(request.form.get('old_password')):
				if request.form.get('new_password') == request.form.get('confirm_new_password'):
					current_user.password = request.form.get('new_password')
					db.session.commit()
					session['set_password'] = False
				else:
					error = "confirm_new_password"
			else:
				error = "old_password"
		elif request.form.get("submit") == "Update Profile":
			error = "profile_success"
			if request.form.get('firstname'):
				if request.form.get('lastname'):
					current_user.firstname = request.form.get('firstname')
					current_user.lastname = request.form.get('lastname')
					db.session.commit()
				else:
					error = "empty_lastname"
			else:
				error = "empty_firstname"
		elif request.form.get("submit") == "Update Phone Number":
			error = "phone_success"
			if request.form.get('phone_number'):
				current_user.phone_number = request.form.get('phone_number')
				db.session.commit()
			else:
				error = "empty_phone_number"
		elif request.form.get("submit") == "Activate 2FA":
			error = "otp_success"
			totp = pyotp.parse_uri(request.form.get("otp_qr"))
			# noinspection PyUnresolvedReferences
			if totp.verify(request.form.get("otp_code")):
				current_user.otp_secret = totp.secret
				db.session.commit()
			else:
				if request.form.get("otp_code"):
					error = "bad_otp_code"
				else:
					error = "empty_otp_code"
		elif request.form.get("submit") == "Save Contact Info":
			error = "contact_success"
			if not request.form.get("contact_name"):
				error = "empty_name"
			elif not request.form.get("contact_phone"):
				error = "empty_phone"
			else:
				current_user.e_con_name = request.form.get("contact_name") or ""
				current_user.e_con_phone = request.form.get("contact_phone") or ""
				db.session.commit()
				error = "contact_success"

		return redirect(url_for("members_routes.account_settings", e=error))


@bp.route("/members/register", methods=["GET", "POST"])
def member_registeration():
	if current_user.is_authenticated:
		return redirect(url_for("members_routes.account_settings"))
	elif request.method == "POST":
		registered_emails = [x[0] for x in User.query.with_entities(User.email).all()]
		if request.form.get("email") in registered_emails:
			return redirect(url_for("routes.members", email=request.form.get("email")))
		if request.form.get("password") != request.form.get("password-confirm"):
			return redirect(url_for("members_routes.register", error="bad_password"))

		new_user = User(
			id=User.get_new_id(),
			first_name=request.form.get("firstname"),
			last_name=request.form.get("lastname"),
			email=request.form.get("email"),
			password=request.form.get("password")
		)
		db.session.add(new_user)
		db.session.commit()

		if len(payments := SubsPayment.query.filter_by(email=new_user.email).order_by(
				SubsPayment.datetime.desc()).all()):
			for payment in payments:
				payment.user_id = new_user.id
			db.session.commit()

			current_date = datetime.now()

			# Calculate the most recent July 1st that has passed
			if current_date.month > 7 or (current_date.month == 7 and current_date.day >= 1):
				most_recent_july_1st = datetime(current_date.year, 7, 1)
			else:
				most_recent_july_1st = datetime(current_date.year - 1, 7, 1)

			# Get the datestamp for midnight on the most recent July 1st
			midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)

			if payments[0].datetime > midnight_july_1st:
				return redirect(url_for("members_routes.dashboard"))

		return redirect(url_for("members_routes.pay_subs"))

	else:
		return render_template(
			"members/register.html",
			error=request.args.get("error") or "",
			no_portal=True,
			css="members.css"
		)


@bp.route("/members/pay_subs", methods=["GET", "POST"])
@login_required
def pay_subs():
	"""member,author,admin"""
	idempotency_key = uuid.uuid4().hex
	subs_levels = json.loads(KeyValue.query.get("subs_levels").value)
	return render_template(
		"members/pay_subs.html",
		idempotency_key=idempotency_key,
		subs_levels=subs_levels,
		css="pay_subs.css",
		js="pay_subs.js"
	)


@bp.route("/api/members/subs_amount/<query>", methods=["GET"])
def subs_amount(query):
	levels = json.loads(KeyValue.query.get("subs_levels").value)
	result = levels.get(query)
	if result is not None:
		if (amount := result.get("amount")) is not None:
			return f"{amount}"
		else:
			abort(404)
	else:
		abort(404)


@bp.route("/api/new_idemp", methods=["GET"])
def new_idemp():
	return jsonify({"new_key": uuid.uuid4().hex})


@bp.route("/api/members/subs_payment", methods=["POST"])
@login_required
def subs_payment():
	"""member,author,admin"""
	amount = 0
	item_id = ""
	try:
		order_idempotency_key = request.json.get("order_idempotency_key")
		payment_idempotency_key = request.json.get("payment_idempotency_key")
		membership_details = {
			"Members Name (A): ": f"{current_user.firstname} {current_user.lastname}",
			"Members Telephone (B):": request.json.get("phone"),
			"Members Email (C):": current_user.email,
			"Emergency Contact Name (D):": request.json.get("e_con_name"),
			"Emergency Contact Telephone (E):": request.json.get("e_con_phone")
		}
		print(membership_details)
		level_details = json.loads(KeyValue.query.get("subs_levels").value).get(request.json.get("level"))
		amount = level_details.get("amount")
		item_id = level_details.get("square_id")
		item_name = request.json.get("level")
	except AttributeError:
		abort(404)

	order_id = None
	# create an order
	result = app.square.orders.create_order(
		body={
			"order": {
				"location_id": app.envs.square_membership_location,
				"line_items": [
					{
						"quantity": "1",
						"name": f"{item_name.capitalize()} Membership",
						"item_type": "ITEM",
						"modifiers": [
							{
								"name": f"{k} {v}",
								"quantity": "1",
								"base_price_money": {
									"amount": 0,
									"currency": "GBP"
								}
							}
							for k, v in membership_details.items()
						],
						"base_price_money": {
							"amount": amount*100,
							"currency": "GBP"
						}
					}
				],
				"fulfillments": [
					{
						"pickup_details": {
							"auto_complete_duration": "P1W",
							"recipient": {
								"display_name": f"{current_user.firstname} {current_user.lastname}"
							},
							"schedule_type": "ASAP",
							"prep_time_duration": "PT0S"
						},
						"type": "PICKUP"
					}
				]
			},
			"idempotency_key": order_idempotency_key
		}
	)
	if result.is_error():
		# print("order error")
		response = make_response(jsonify(result.body))
		response.status_code = 400
		return response
	elif result.is_success():
		# print(result.body)
		order_id = result.body["order"]["id"]

		payment_body = {
			"accept_partial_authorization": False,
			"autocomplete": True,
			"source_id": request.json.get("source_id"),
			"verification_token": request.json.get("verification_token"),
			"idempotency_key": payment_idempotency_key,
			"amount_money": {
				"amount": amount*100,
				"currency": "GBP"
			},
			"location_id": app.envs.square_membership_location,
			"note": f"{item_name.capitalize()} Membership"
		}

		if order_id is not None:
			payment_body["order_id"] = order_id

		payment_result = app.square.payments.create_payment(
			body=payment_body
		)
		if payment_result.is_error():
			print("payment error")
			print(payment_result.errors)
			response = make_response(jsonify(payment_result.body))
			response.status_code = 400
			return response
		elif payment_result.is_success():
			print(payment_result.body)

			new_subs_payment = SubsPayment(
				id=SubsPayment.get_new_id(),
				user_id=current_user.id,
				membership_type=item_name,
				amount_paid=amount,
				datetime=datetime.utcnow(),
				name=f"{current_user.firstname} {current_user.lastname}",
				email=current_user.email,
				phone_number=request.json.get("phone"),
				e_con_name=request.json.get("e_con_name"),
				e_con_phone=request.json.get("e_con_phone"),
				order_id=order_id,
				payment_id=payment_result.body["payment"].get("id"),
				source="oadp"
			)
			db.session.add(new_subs_payment)
			db.session.commit()

			return jsonify(payment_result.body)


@bp.route("/members/update_subs")
def update_subs():
	latest_square_date = SubsPayment.query.filter_by(source="square").order_by(SubsPayment.datetime.desc()).first().datetime
	latest_known_order_id = SubsPayment.query.filter_by(source="square").order_by(SubsPayment.datetime.desc()).with_entities(SubsPayment.order_id).first().order_id

	square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
	results = app.square.orders.search_orders(
		body={
			"location_ids": [
				"0W6A3GAFG53BH"
			],
			"query": {
				"filter": {
					"date_time_filter": {
						"created_at": {
							"start_at": latest_square_date.strftime(square_date_format)
						}
					},
					"source_filter": {
						"source_names": [
							"Checkout Link"
						]
					},
					"state_filter": {
						"states": [
							"OPEN",
							"COMPLETED"
						]
					}
				}
			}
		}
	)
	if results.is_error():
		print("Error:", results.errors)
		if request.user_agent.string == "OADP_Scheduler":
			resp.status_code = 500
			return make_response(jsonify({
				"Error": "Square API Error"
			}), 500)
		else:
			abort(500)
	else:
		type_regex = re.compile(fr"{'|'.join(json.loads(KeyValue.query.get('subs_levels').value).keys())}")
		details_regex = re.compile(r"\((A|B|C|D|E)\): (.*)")
		for result in results.body.get("orders") or []:
			if result.get("id") == latest_known_order_id:
				break
			for line_item in result.get("line_items") or []:
				if type_regex.search(line_item.get("name").lower()):
					details = {}
					for modifier in line_item.get("modifiers") or []:
						deets = details_regex.search(modifier["name"])
						details[deets.group(1)] = deets.group(2)
					if list(details.keys()) == ['A', 'B', 'C', 'D', 'E']:
						pprint(details)
						try:
							user_id = User.query.filter_by(email=details.get('C')).with_entities(User.id).first().id
						except AttributeError:
							user_id = None
						new_sub = SubsPayment(
							id=SubsPayment.get_new_id(),
							user_id=user_id,
							membership_type=type_regex.search(line_item.get("name").lower()).group(0),
							amount_paid=line_item["total_money"]["amount"],
							datetime=result.get("created_at") or datetime.utcnow(),
							name=details.get('A'),
							email=details.get('C'),
							phone_number=details.get('B'),
							e_con_name=details.get('D'),
							e_con_phone=details.get('E'),
							order_id=result.get("id"),
							payment_id=result["tenders"][0].get("id"),
							source="square"
						)
						db.session.add(new_sub)

		sq_updated = KeyValue.query.get("square_subs_updated")
		sq_updated.value = datetime.utcnow()
		db.session.commit()
		return redirect(url_for("members_routes.get_subs"))


@bp.route("/members/api/get_subs")
@bp.route("/members/get_subs")
@login_required
def get_subs():
	"""admin"""
	if current_user.role == "admin" or current_user.id == "GCs4BJ9rQ2jaoWK":
		date_string = KeyValue.query.get("square_subs_updated").value
		date_split = date_string.split(".")
		date_split[-1].ljust(6 - len(date_split[-1]), "0")
		print(".".join(date_split))
		sq_updated = datetime.fromisoformat(".".join(date_split))
		current_date = datetime.now()

		oldest_entry_year = db.session.query(
			SubsPayment.datetime
		).order_by(
			SubsPayment.datetime.asc()
		).limit(1).first().datetime.year

		if "startyear" in request.args.keys():
			year = int(request.args.get("startyear"))
			most_recent_july_1st = datetime(year, 6, 1)
		else:
			# Calculate the most recent July 1st that has passed
			if current_date.month > 6 or (current_date.month == 6 and current_date.day >= 1):
				most_recent_july_1st = datetime(current_date.year, 6, 1)
			else:
				most_recent_july_1st = datetime(current_date.year - 1, 6, 1)

		# Get the datestamp for midnight on the most recent July 1st
		midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)
		paid = list(SubsPayment.query
					.filter(SubsPayment.datetime > midnight_july_1st)
					.filter(midnight_july_1st + timedelta(weeks=52) > SubsPayment.datetime)
					.order_by(SubsPayment.datetime.asc())
					.with_entities(
						SubsPayment.name,
						SubsPayment.membership_type,
						SubsPayment.amount_paid,
						SubsPayment.payment_fee,
						SubsPayment.payment_id,
						SubsPayment.refunded
					).all()
				)
		detailed = "detailed" in request.args.keys()
		results = []
		types = {}
		totals = {"total": 0, "fees": 0, "refunds": 0, "net": 0}
		for entry in paid:
			totals["total"] = totals["total"] + entry.amount_paid
			totals["fees"] = totals["fees"] + entry.payment_fee
			if entry.refunded:
				totals["refunds"] = totals["refunds"] + entry.amount_paid
				totals["net"] = totals["net"] + entry.amount_paid - entry.payment_fee - entry.amount_paid
			else:
				totals["net"] = totals["net"] + entry.amount_paid - entry.payment_fee
			if detailed:
				new_result = {
					"name": entry.name,
					"type": entry.membership_type,
					"amount": entry.amount_paid,
					"fee": entry.payment_fee
				}
				types[entry.membership_type] = types.get(entry.membership_type, 0) + 1
				if entry.payment_fee is None:
					sq_results = app.square.payments.get_payment(
						payment_id=entry.payment_id,
					)
					if sq_results.is_success():
						fees = sq_results.body.get("payment", {}).get("processing_fee", {})
						for fee in fees:
							new_result["fee"] = new_result.get("fee", 0) + fee.get("amount_money", {}).get("amount", 0)
			else:
				new_result = {
					"name": entry.name
				}
			results.append(new_result)

		if "api" in str(request.url_rule):
			print(totals)
			return jsonify({
				'totals': totals
			})

		return render_template(
			"members/get_subs.html",
			results=results,
			types=types,
			detailed=detailed,
			oldest_entry_year=oldest_entry_year,
			since=midnight_july_1st,
			sq_updated=sq_updated,
			css="m_dashboard.css"
		)
	else:
		abort(403)


@bp.route("/members/api/get_sums")
@bp.route("/members/get_sums")
@login_required
def get_sums():
	"""admin"""
	if current_user.role == "admin":
		square_date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
		current_date = datetime.now()
		if "startyear" in request.args.keys():
			year = int(request.args.get("startyear"))
			start_date = datetime(year, 6, 1)
		else:
			# Calculate the most recent July 1st that has passed
			if current_date.month > 6 or (current_date.month == 6 and current_date.day >= 1):
				start_date = datetime(current_date.year, 6, 1)
			else:
				start_date = datetime(current_date.year - 1, 6, 1)
		end_date = start_date + timedelta(weeks=52)

		errors = 0
		total_amounts = 0
		total_refund_amounts = 0
		total_refunds = 0
		total_fees = 0
		total_transactions = 0

		result = app.square.locations.list_locations()
		for location in result.body.get("locations"):
			flag = True
			test = True
			cursor = ""
			while flag:
				if cursor:
					result = app.square.payments.list_payments(
						begin_time=start_date.strftime(square_date_format),
						end_time=end_date.strftime(square_date_format),
						location_id=location.get("id"),
						cursor=cursor
					)
				else:
					result = app.square.payments.list_payments(
						begin_time=start_date.strftime(square_date_format),
						end_time=end_date.strftime(square_date_format),
						location_id=location.get("id")
					)

				if result.is_error():
					# print(result.errors)
					errors += 1
					flag = False
				else:
					# payments += list(result.body.get("payments") or [])
					for payment in (result.body.get("payments") or []):
						if payment.get("source_type") in ["CARD", "BUY_NOW_PAY_LATER"] and payment.get("status") == "COMPLETED":
							total_transactions += 1
							total_amounts += payment.get("amount_money").get("amount")
							fees = payment.get("processing_fee")
							# if fees is None:
							# 	print(payment)
							for fee in fees:
								total_fees += fee.get("amount_money").get("amount")
					if not (cursor := result.body.get("cursor")):
						flag = False


		flag = True
		test = True
		cursor = ""
		while flag:
			if cursor:
				result = app.square.refunds.list_payment_refunds(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
					cursor=cursor
				)
			else:
				result = app.square.refunds.list_payment_refunds(
					begin_time=start_date.strftime(square_date_format),
					end_time=end_date.strftime(square_date_format),
				)

			if result.is_error():
				# print(result.errors)
				errors += 1
				flag = False
			else:
				# payments += list(result.body.get("payments") or [])
				for refund in (result.body.get("refunds") or []):
					if refund.get("status") == "COMPLETED":
						total_refunds += 1
						total_refund_amounts += refund.get("amount_money").get("amount")
				if not (cursor := result.body.get("cursor")):
					flag = False

		shows = db.session.query(
			Show.id,
			Show.title
		).filter(Show.date>start_date).filter(end_date>Show.date)

		data = {
			'type': 'accounting',
			'sub_type': 'full_year_overview',
			'title': 'Year Overview',
			'year': request.args.get('startyear'),
			'totals': {
				'total_transactions': total_transactions,
				'total_refunds': total_refunds,
				'total_amounts': total_amounts,
				'total_fees': total_fees,
				'total_refund_amounts': total_refund_amounts,
				'total_net': total_amounts - total_fees - total_refund_amounts
			},
			'shows': [
				{
					'id': show.id,
					'title': show.title
				} for show in shows
			]
		}
		if "api" in str(request.url_rule) or "react" in request.args.keys():
			return jsonify(data)
		else:
			data["initialData"] = True
			return render_template(
				"react_template.html",
				data=data
			)
	else:
		abort(403)

@bp.route("/members/logout")
@login_required
def logout():
	"""member,author,admin"""
	logout_user()
	return redirect(url_for("routes.frontpage"))


@bp.route("/members/test", methods=["GET"])
@login_required
def test():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	test1 = User.query.get("r5zwBgKQjl7Kesy")
	return jsonify(test1.verify_password("r5zwBgKQjl7Kesy"))
