from datetime import datetime
from pprint import pprint

import psycopg2
import sqlalchemy
from lorem_text import lorem as lorem_func
import pyotp

from flask import abort, Blueprint, make_response, redirect, jsonify, \
	render_template, Response, send_file, send_from_directory, url_for, request, session
from flask_login import login_user, current_user
# noinspection PyPackageRequirements
from sqlalchemy import or_

from webapp.members_routes import MemberPost
# noinspection PyPep8Naming
from webapp.models import BlogImage, BlogPost, Files, KeyValue, Member, Post, PrizeDrawEntry, Show, ShowPhotos, User, \
	MemberShowLink as MSL, db, SubsPayment


from flask import current_app as app
bp = Blueprint("routes", __name__)


class NavItem:
	def __init__(self, tit, lin):
		self.title = tit
		self.link = lin


class MemberRenderer:
	has_user = False
	has_diff = False

	def __init__(self, member, user=None):
		try:
			self.role_type = member.cast_or_crew
		except AttributeError:
			self.role_type = ""

		try:
			self.role = member.role_name
		except AttributeError:
			self.role = ""

		if user is None:
			self.id = member.id
			self.firstname = member.firstname
			self.lastname = member.lastname
		else:
			self.id = user.id
			self.firstname = user.firstname
			self.lastname = user.lastname
			self.has_user = True

			if (member.firstname != user.firstname) or (member.lastname != user.lastname):
				self.as_firstname = member.firstname
				self.as_lastname = member.lastname
				self.has_diff = True

	def get_link(self):
		return "/".join(["/past-shows", ["m", "u"][self.has_user], self.id, "-".join([self.firstname, self.lastname])])


# noinspection PyUnresolvedReferences
@bp.route("/", methods=["GET"])
def frontpage():
	latest_show = Show.query \
		.filter(Show.date < datetime.now()) \
		.order_by(Show.date.desc()) \
		.first()

	all_photos = ShowPhotos.query \
		.filter_by(show_id=latest_show.id) \
		.all()

	photos = []
	for i in all_photos:
		size = i.photo_desc.split(",")
		if size[0] > size[1]:
			photos.append(i)

		if len(photos) == (5 - int(KeyValue.query.filter_by(key="tickets-active").first().value)):
			break

	post = Post.query \
		.filter(or_(Post.type == "public", Post.type == "auditions")) \
		.join(Show, Post.show_id == Show.id) \
		.filter(Show.date > datetime.now()) \
		.order_by(Show.date.asc()) \
		.order_by(Post.date.desc()) \
		.with_entities(
			Post.date,
			Post.title,
			Post.content,
			Post.type,
			Post.linked_files,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle")
		) \
		.first()

	if post is None:
		files = []
		post = Show.query \
			.filter(Show.date > datetime.now()) \
			.order_by(Show.date.asc()) \
			.with_entities(
				Show.title.label("show_title"),
				Show.subtitle.label("show_subtitle")
			) \
			.first()
	else:
		files = [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in Files.query\
				.filter(
					Files.id.in_(post.linked_files["files"])
				)\
				.all()
		]
	print(files)
	return render_template(
		"frontpage.html",
		latest_show=latest_show,
		post=post,
		photos=photos,
		frontpage=True,
		title="Home",
		files=files,
		no_portal=True,
		css=["m_dashboard.css", "frontpage.css"],
		js="carousel.js"
	)


@bp.get("/links")
def links():
	return render_template(
		"layout.html",
		css="links.css"
	)


# noinspection PyUnresolvedReferences
@bp.route("/auditions", methods=["GET"])
def auditions():
	post = Post.query \
		.filter_by(type="auditions") \
		.join(Show, Post.show_id == Show.id) \
		.filter(Show.date > datetime.now()) \
		.order_by(Show.date.asc()) \
		.order_by(Post.date.desc()) \
		.with_entities(
			Post.date,
			Post.title,
			Post.content,
			Show.title.label("show_title"),
			Show.subtitle.label("show_subtitle"),
			Post.linked_files
		) \
		.first()

	if post is not None:
		files = [
			MemberPost(
				post_id=i.id,
				title=i.name,
				date=i.date,
				post_type="file"
			) for i in Files.query\
				.filter(
					Files.id.in_(post.linked_files["files"])
				)\
				.all()
		]
	else:
		files = []

	return render_template(
		"auditions.html",
		post=post,
		files=files,
		no_portal=True,
		css=["m_dashboard.css", "frontpage.css"]
	)


@bp.route("/search", methods=["GET"])
def search():
	class Result:
		def __init__(self, link, title, searchable_text, result_type):
			self.link = link
			self.title = title
			self.searchable = searchable_text
			self.type = result_type

	results = []

	for result in Show.query.filter(Show.date < datetime.now()).order_by(Show.date).all():
		searchable = " ".join([
			result.title or "",
			result.subtitle or "",
			str(result.date.year),
			result.season or "",
			result.text_blob or "",
			result.author or "",
			result.show_type or "",
			result.genre or ""
		])
		results.append(
			Result(
				f"/past-show/{result.id}/{'-'.join(result.title.split(' '))}",
				result.title,
				searchable,
				"Show"
			)
		)

	for result in Post.query \
		.filter(Post.date < datetime.now()) \
		.filter_by(type="blog") \
		.order_by(Post.date).all():
		searchable = " ".join([
			result.title or "",
			result.type or "",
			result.content or ""
		])
		results.append(
			Result(
				f"/blog/{result.id}",
				result.title,
				searchable,
				"Blog"
			)
		)
	for result in Post.query \
		.filter(Post.date < datetime.now()) \
		.filter(or_(Post.type == "public", Post.type == "auditions")) \
		.order_by(Post.date.desc()).all():
		searchable = " ".join([
			result.title or "",
			result.type or "",
			result.content or ""
		])
		results.append(
			Result(
				f"/blog/{result.id}",
				result.title,
				searchable,
				"Post"
			)
		)

	users_list = {}
	members_list = []
	for member in Member.query.all():
		if member.associated_user is not None:
			if member.associated_user not in users_list.keys():
				user = User.query.filter_by(id=member.associated_user).first()
				for i in Member.query.filter_by(associated_user=member.associated_user).all():
					users_list.setdefault(member.associated_user, []).append(
						MemberRenderer(
							i,
							user
						)
					)
		else:
			members_list.append(
				MemberRenderer(
					member
				)
			)

	for result in [*users_list.values(), *members_list]:
		if isinstance(result, list):
			renderer = result[0]
			searchable = " ".join([
				f"{i.as_firstname} {i.as_lastname}"
				if i.has_diff else
				f"{i.firstname} {i.lastname}"
				for i in result
			])
		else:
			renderer = result
			searchable = " ".join([
				result.firstname,
				result.lastname
			])
		results.append(
			Result(
				renderer.get_link(),
				f"{renderer.firstname} {renderer.lastname}",
				searchable,
				"Member"
			)
		)
	return render_template(
		"search.html",
		results=results,
		js="quicksearch.js",
		css="search.css"
	)


@bp.route("/blog", methods=["GET"])
def blogs():
	posts = Post.query.filter_by(type="blog").filter(Post.date < datetime.now()).order_by(Post.date.desc()).all()
	return render_template(
		"blogs.html",
		template={True: "blank_template.html", False: "layout.html"}["embedded" in request.args],
		embedded={True: "embedded", False: ""}["embedded" in request.args],
		css="blogs.css",
		posts=posts
	)


@bp.route("/blog/latest", methods=["GET"])
def latest_blog():
	post = Post.query.filter_by(type="blog").filter(Post.date < datetime.now()).order_by(Post.date.desc()).first_or_404()
	return redirect("/".join(["/blog", post.id]))


@bp.route("/blog/<post_id>", methods=["GET"])
def blog_post(post_id):
	post = Post.query.filter_by(id=post_id).first_or_404()
	author = User.query.filter_by(id=post.author).first()
	post.views += 1
	db.session.commit()
	return render_template(
		"post.html",
		template={True: "blank_template.html", False: "layout.html"}["embedded" in request.args],
		embedded={True: "embedded", False: ""}["embedded" in request.args],
		post=post,
		author=author,
		css="post.css"
	)


@bp.get("/blog_img/<blog_id>/<int:image_no>")
def blog_img(blog_id, image_no):
	img = BlogImage.query.get((blog_id, image_no)).image
	if img is not None:
		return make_response(img)
	else:
		abort(404)


@bp.route("/past-shows")
def past_shows():
	shows = Show.query \
		.filter(Show.date < datetime.now()) \
		.order_by(Show.date.desc()) \
		.all()
	return render_template(
		"past_shows.html",
		shows=shows,
		manage_shows=False,
		no_portal=True,
		css="past_shows.css",
		js=["past_shows.js", "quicksearch.js"]
	)


@bp.route("/past-shows/<show_id>", methods=["GET"])
def past_show_redirect(show_id):
	show = Show.query.filter_by(id=show_id).first_or_404()
	title = show.title.lower().replace(" ", "-")
	return redirect("/".join([show_id, title]))


@bp.route("/past-shows/<show_id>/<test>")
def past_show_page(show_id, test):
	test += " "

	show = Show.query.filter_by(id=show_id).first_or_404()

	raw_cast = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="cast") \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
			MSL.show_id,
			MSL.cast_or_crew,
			MSL.role_name,
			Member.id,
			Member.firstname,
			Member.lastname,
			Member.associated_user
		) \
		.order_by(MSL.order_val) \
		.all()
	cast = {}
	directors = []
	producers = []
	for member in raw_cast:
		user = User.query.filter_by(id=member.associated_user).first()
		cast.setdefault(member.role_name, []).append(MemberRenderer(member, user))

	raw_crew = MSL.query \
		.filter_by(show_id=show_id, cast_or_crew="crew") \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
			MSL.show_id,
			MSL.cast_or_crew,
			MSL.role_name,
			Member.id,
			Member.firstname,
			Member.lastname,
			Member.associated_user
		) \
		.order_by(MSL.order_val) \
		.all()
	crew = {}
	for member in raw_crew:
		user = User.query.filter_by(id=member.associated_user).first()
		crew.setdefault(member.role_name, []).append(MemberRenderer(member, user))
		if member.role_name == "Director":
			directors.append(MemberRenderer(member, user))
		elif member.role_name == "Producer":
			producers.append(MemberRenderer(member, user))

	print(directors)

	photos = ShowPhotos.query.filter_by(show_id=show_id, photo_type="photo").all()
	videos = ShowPhotos.query.filter_by(show_id=show_id, photo_type="video").all()

	if "embedded" in request.args.keys():
		return render_template(
			"past_show_photos.html",
			show=show,
			cast=cast,
			crew=crew,
			photos=photos,
			videos=videos,
			directors=directors,
			producers=producers,
			title=show.title,
			css="past_show_page.css",
			js="past_show_page.js"
		)
	else:

		return render_template(
			"past_show_page.html",
			show=show,
			cast=cast,
			crew=crew,
			photos=photos,
			videos=videos,
			directors=directors,
			producers=producers,
			title=show.title,
			css="past_show_page.css",
			js="past_show_page.js"
		)


@bp.route("/past-shows/u/<user_id>")
def u_redirect(user_id):
	user = User.query.filter_by(id=user_id).first_or_404()
	page_title = "-".join([user.firstname, user.lastname])
	return redirect("/".join([user_id, page_title]))


# noinspection DuplicatedCode
@bp.route("/past-shows/u/<user_id>/<test>")
def u(user_id, test):
	test += " "
	user_members = [
		i[0] for i in
		Member.query
		.filter(Member.associated_user == user_id)
		.with_entities(Member.id)
		.all()
	]

	# noinspection PyUnresolvedReferences
	msls = MSL.query \
		.filter(MSL.member_id.in_(user_members)) \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
			MSL.show_id,
			MSL.cast_or_crew,
			MSL.role_name,
			Member.id,
			Member.firstname,
			Member.lastname,
			Member.associated_user
		) \
		.all()

	user = User.query.filter_by(id=user_id).first_or_404()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link, user))

	# noinspection PyUnresolvedReferences
	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		no_portal=True,
		user=user,
		js="past_shows.js",
		css="past_shows.css"
	)


@bp.route("/past-shows/m/<member_id>")
def m_redirect(member_id):
	member = Member.query.filter_by(id=member_id).first_or_404()
	page_title = "-".join([member.firstname, member.lastname])
	return redirect("/".join([member_id, page_title]))


# noinspection DuplicatedCode
@bp.route("/past-shows/m/<member_id>/<test>")
def m(member_id, test):
	test += " "
	member = Member.query.filter_by(id=member_id).first_or_404()
	msls = MSL.query \
		.filter(MSL.member_id == member_id) \
		.join(Member, MSL.member_id == Member.id) \
		.with_entities(
			MSL.show_id,
			MSL.cast_or_crew,
			MSL.role_name,
			Member.id,
			Member.firstname,
			Member.lastname,
			Member.associated_user
		).all()

	# user = User.query.filter_by(id=user_id).first()
	shows = {}
	for link in msls:
		shows.setdefault(link.show_id, []).append(MemberRenderer(link))

	# noinspection PyUnresolvedReferences
	show_details = {i.id: i for i in Show.query.order_by(Show.date.desc()).filter(Show.id.in_(shows.keys())).all()}

	return render_template(
		"shows_by_person.html",
		shows=shows,
		show_details=show_details,
		no_portal=True,
		user=member,
		js="past_shows.js",
		css="past_shows.css"
	)


@bp.route("/lorem", methods=["GET"])
def lorem():
	# text = lorem.paragraphs(20)
	return render_template("lorem.html", lorem=lorem_func.paragraphs(30), css="frontpage.css")


@bp.route("/database", methods=["GET"])
def database():
	stats = {
		"Shows": Show.query.count(),
		"Members": Member.query.count(),
		"Cast/Crew Roles": MSL.query.count(),
		"Blogposts": BlogPost.query.count(),
		"Photos": ShowPhotos.query.count()
	}
	return render_template("database.html", stats=stats, css="frontpage.css")


@bp.route("/about-us")
def about():
	return render_template(
		"about-us.html",
		maps_url=KeyValue.query.filter_by(key="maps-url").first(),
		about=KeyValue.query.filter_by(key="about").first_or_404(),
		css="frontpage.css"
	)


@bp.route("/tickets")
def tickets():
	return render_template(
		"tickets.html",
		css="frontpage.css"
	)


@bp.route("/prizedraw", methods=["GET", "POST"])
def prizedraw():
	if request.method == "POST":
		if session.get('prizedraw') in [x[0] for x in PrizeDrawEntry.query.with_entities(PrizeDrawEntry.id).all()]:
			return redirect(url_for("routes.prizedraw"))

		new_entry = PrizeDrawEntry(
			id=PrizeDrawEntry.get_new_id(),
			name=request.form.get('name'),
			email=request.form.get('email'),
			phone_number=request.form.get('phone_number'),
			terms_agreed=request.form.get('terms_agreed'),
			datetime=datetime.utcnow()
		)

		try:
			db.session.add(new_entry)
			db.session.commit()
			entry_id = new_entry.id
			msg = "success"
		except psycopg2.errors.UniqueViolation:
			db.session.rollback()
			msg = "already_entered"
			entry_id = PrizeDrawEntry.query.filter(
				or_(
					PrizeDrawEntry.email == request.form.get('email'),
					PrizeDrawEntry.email == request.form.get('phone_number')
				)
			).first().id
		except sqlalchemy.exc.IntegrityError:
			db.session.rollback()
			msg = "already_entered"
			entry_id = PrizeDrawEntry.query.filter(
				or_(
					PrizeDrawEntry.email == request.form.get('email'),
					PrizeDrawEntry.email == request.form.get('phone_number')
				)
			).first().id
		except sqlalchemy.exc.PendingRollbackError:
			db.session.rollback()
			msg = "already_entered"
			entry_id = PrizeDrawEntry.query.filter(
				or_(
					PrizeDrawEntry.email == request.form.get('email'),
					PrizeDrawEntry.email == request.form.get('phone_number')
				)
			).first().id

		# on success
		session['prizedraw'] = entry_id
		session.modified = True
		return redirect(url_for("routes.prizedraw", e=msg))
	else:
		entered = False
		session_entered = session.get('prizedraw') in [x[0] for x in PrizeDrawEntry.query.with_entities(PrizeDrawEntry.id).all()]
		details_entered = request.args.get('e') in ['already_entered', 'success']
		if session_entered or details_entered:
			entered = True
		return render_template(
			"prizedraw.html",
			entered=entered,
			css="pay_subs.css"
		)


# noinspection PyUnusedLocal
@app.errorhandler(401)
@bp.route("/members", methods=["GET", "POST"])
def members(*args):
	if current_user.is_authenticated:
		return redirect(url_for("members_routes.dashboard"))
	else:
		if request.method == "POST":
			user = User.query.filter_by(email=request.form['email']).first()
			if user is not None and user.verify_password(request.form['password']):
				if user.otp_secret != "" and user.otp_secret is not None:
					session['email'] = request.form['email']
					return redirect(url_for("routes.otp"))
				else:
					session['set_password'] = request.form.get('password') == user.id
					login_user(user)
					return redirect(url_for('members_routes.dashboard'))
			else:
				return redirect(url_for("routes.members", error="bad_login"))
		elif request.method == "GET":
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
				"members.html",
				error=request.args.get("error") or "",
				files=files,
				no_portal=True,
				css=["m_dashboard.css", "members.css"]
			)


@bp.route("/members/otp", methods=["GET", "POST"])
def otp():
	if request.method == "GET":
		if 'email' not in session:
			return redirect(url_for('routes.members'))
		return render_template("otp.html", css="members.css")
	else:
		user = User.query.filter_by(email=session['email']).first()
		totp = pyotp.TOTP(user.otp_secret)
		session.pop('email', None)
		if totp.verify(request.form['otp']):
			login_user(user)
			return redirect(url_for("members_routes.dashboard"))
		else:
			return redirect(url_for("routes.members"))


# @bp.route("/members/register0", methods=["GET", "POST"])
def register():
	if request.method == "GET":
		if current_user.is_authenticated:
			return redirect(url_for("members_routes.dashboard"))

		current_date = datetime.now()
		# Calculate the most recent July 1st that has passed
		if current_date.month > 7 or (current_date.month == 7 and current_date.day >= 1):
			most_recent_july_1st = datetime(current_date.year, 7, 1)
		else:
			most_recent_july_1st = datetime(current_date.year - 1, 7, 1)
		# Get the datestamp for midnight on the most recent July 1st
		midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)

		results = app.square.orders.search_orders(
			body={
				"location_ids": [
					"0W6A3GAFG53BH"
				],
				"query": {
					"filter": {
						"date_time_filter": {
							"created_at": {
								"start_at": midnight_july_1st.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
							}
						},
						"source_filter": {
							"source_names": [
								"Checkout Link"
							]
						}
					}
				}
			}
		)

		if results.is_error():
			print(results.errors)
			abort(500)
		else:
			paid_emails = []
			for order in results.body["orders"]:
				for item in order["line_items"]:
					try:
						for modifier in item["modifiers"]:
							if ">Members Email (C): " in modifier["name"]:
								paid_emails.append(modifier["name"].replace(">Members Email (C): ", ""))
					except KeyError:
						pprint(item)
			pprint(paid_emails)
		return render_template(
			"members/register.html",
			css="pay_subs.css"
		)
	elif request.method == "POST":
		if User.query.filter_by(email=request.form.get('email')).first() is not None:
			return redirect(url_for("routes.members", email=request.form.get('email')))
		elif request.form.get("password") != request.form.get('password-confirm'):
			return redirect(url_for("routes.register", e="password-confirm"))
		else:
			new_user_params = {
				'firstname': request.form.get('firstname'),
				'lastname': request.form.get('lastname'),
				'email': request.form.get('email'),
				'password': request.form.get('password')
			}

			current_date = datetime.now()
			# Calculate the most recent July 1st that has passed
			if current_date.month > 7 or (current_date.month == 7 and current_date.day >= 1):
				most_recent_july_1st = datetime(current_date.year, 7, 1)
			else:
				most_recent_july_1st = datetime(current_date.year - 1, 7, 1)
			# Get the datestamp for midnight on the most recent July 1st
			midnight_july_1st = most_recent_july_1st.replace(hour=0, minute=0, second=0, microsecond=0)

			results = app.square.orders.search_orders(
				body={
					"location_ids": [
						"0W6A3GAFG53BH"
					],
					"query": {
						"filter": {
							"date_time_filter": {
								"created_at": {
									"start_at": midnight_july_1st.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
								}
							},
							"source_filter": {
								"source_names": [
									"Checkout Link"
								]
							}
						}
					}
				}
			)

			if results.is_error():
				abort(500)
			else:
				paid_emails = []
				for order in results.body["orders"]:
					for item in order["line_items"]:
						for modifier in item["modifier"]:
							if ">Members Email (C): " in modifier["name"]:
								paid_emails.append(modifier["name"].replace(">Members Email (C):", ""))
				print(paid_emails)
				if new_user_params['email'] in paid_emails:
					new_user = User(
						**new_user_params
					)
					db.session.add(new_user)
					db.session.commit()

					login_user(new_user)
					return redirect("members_routes.dashboard")
				else:
					session['new_user_params'] = new_user_params
					session.modified = True
					return redirect("members_routes.pay_subs")


@bp.route("/newsletter", methods=["GET", "POST"])
def newsletter():
	if request.method == "GET":
		return redirect("https://silchester-players.square.site/")
		# return render_template(
		# 	"newsletter.html",
		# 	er=request.args.get("er"),
		# 	css="members.css"
		# )
	if request.method == "POST":
		if (group_id := KeyValue.query.get("audience_emails_group").value) is None:
			abort(404)
		email_address = request.form.get("email")
		result = app.square.customers.search_customers(
			body={
				"limit": 1,
				"query": {
					"filter": {
						"email_address": {
							"exact": email_address
						}
					}
				}
			}
		)

		if result.is_success():
			print(result.body)
			if result.body.get("customers") is None:
				create_result = app.square.customers.create_customer(
					body={
						"email_address": email_address,
					}
				)
				if create_result.is_success():
					# print(create_result.body)
					# print("customer created")
					customer = create_result.body.get("customer")
				elif create_result.is_error():
					# print(create_result.errors)
					# print("Throw error")
					return redirect(url_for("routes.newsletter", er="email_invalid"))

			else:
				customer = result.body.get("customers")[0]
				# pprint(customer)
				# print("customer collected")

			group_add_result = app.square.customers.add_group_to_customer(
				customer_id=customer.get("id"),
				group_id=group_id
			)

			if group_add_result.is_success():
				# print(group_add_result.body)
				# print("added to group")
				return redirect(url_for("routes.newsletter", er="success"))
			elif group_add_result.is_error():
				# print(group_add_result.errors)
				# print("adding error")
				abort(500)

		elif result.is_error():
			# print(result.errors)
			# print("email address error")
			abort(500)


@bp.route("/js/<string:filename>", methods=["GET"])
def js(filename):
	fp = 'static/js/' + filename
	try:
		response = make_response(send_file(fp.replace("\\", "/")))
		response.headers['mimetype'] = 'text/javascript'
		return response
	except OSError:
		abort(404)


@bp.route("/css/<string:filename>", methods=["GET"])
def css(filename):
	fp = 'static/css/' + filename
	try:
		response = make_response(send_file(fp.replace("\\", "/")))
		response.headers['mimetype'] = 'text/css'
		return response
	except OSError:
		abort(404)


# noinspection PyUnresolvedReferences
@bp.get("/sounds/<filename>")
def sound(filename):
	if filename not in app.available_sounds:
		abort(404)
	else:
		response = send_from_directory(app.sounds_path, filename)
		return response


@bp.get("/favicon.svg")
def favicon():
	response = Response(KeyValue.query.filter_by(key="site_logo").first().value, mimetype='image/svg+xml')
	return response


# @bp.route("/emrg")
# def emergency_user():
# 	kwargs = {
# 		"email": "test2@example.com",
# 		"password": "test"
# 	}
# 	used_ids = [value[0] for value in User.query.with_entities(User.id).all()]
# 	new_id = corha.rand_string(kwargs["email"], 16, used_ids)
# 	kwargs["id"] = new_id
# 	new_user = User(**kwargs, otp_secret=pyotp.random_base32())
# 	db.session.add(new_user)
# 	db.session.commit()
#
# 	return redirect(url_for("frontpage"))


@bp.route("/accessibility")
def accessibility():
	if request.args.get('theme') is not None:
		session["theme"] = request.args.get('theme')
	if request.args.get('fontsize') is not None:
		session["fontsize"] = request.args.get('fontsize')

	session.modified = True

	return redirect(request.referrer)


@bp.route("/tempest")
def tempest_redirect():
	return redirect("/past-shows/L2hhNXIZPeXgGyY/the-tempest")
# TODO: change this to allow configuring custom redirects through admin settings
