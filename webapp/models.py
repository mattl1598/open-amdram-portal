from datetime import datetime, timezone
from corha import corha
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.mutable import MutableDict
# noinspection PyPackageRequirements
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin
from sqlalchemy.orm import deferred

db = SQLAlchemy()
login_manager = LoginManager()


class NewIdGetter:

	def __init__(self, **kwargs):
		print(kwargs)

	# noinspection PyUnresolvedReferences
	@classmethod
	def get_new_id(cls):
		used_ids = [value[0] for value in cls.query.with_entities(cls.id).all()]
		return corha.rand_string(datetime.now(timezone.utc).isoformat(), 16, used_ids)


class KeyValue(db.Model):
	key = db.Column(db.String(32), primary_key=True)
	value = db.Column(db.Text)

	def __repr__(self):
		return f"KeyValue('{self.key}','{self.value}')"


class Files(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16))
	name = db.Column(db.String(100))
	content = db.Column(db.LargeBinary)
	date = db.Column(db.DateTime, default=datetime.utcnow)

	def __repr__(self):
		return f"Files('{self.id}', '{self.show_id}', '{self.name}', '{self.content}', '{self.date}')"

	@staticmethod
	def get_type():
		return "Files"


class Post(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	type = db.Column(db.String(16))
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	author = db.Column(db.String(16), db.ForeignKey('user.id'))
	title = db.Column(db.String(80))
	content = db.Column(db.Text)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	views = db.Column(db.Integer, default=0)
	linked_files = db.Column(MutableDict.as_mutable(db.JSON))

	@staticmethod
	def get_type():
		return "Post"


class PrizeDrawEntry(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	name = db.Column(db.String(50))
	email = db.Column(db.String(120), unique=True)
	phone_number = db.Column(db.String(13), unique=True)
	terms_agreed = db.Column(db.String(20))
	datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class User(UserMixin, db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	firstname = db.Column(db.String(20))
	lastname = db.Column(db.String(30))
	email = db.Column(db.String(120), unique=True)
	phone_number = db.Column(db.String(13))
	otp_secret = db.Column(db.String(32))
	password_hash = db.Column(db.String(128))
	password = db.Column(db.String(60))
	role = db.Column(db.String(30))
	e_con_name = db.Column(db.String(50))
	e_con_phone = db.Column(db.String(13))
	square_customer_id = db.Column(db.String(64))

	blogpost = db.relationship('BlogPost', backref='user', lazy=True)
	post = db.relationship('Post', backref='user', lazy=True)
	member = db.relationship('Member', backref='user', lazy=True)
	subs_payment = db.relationship('SubsPayment', backref='user', lazy=True)
	subs = db.relationship('Subscription', backref='user', lazy=True)

	def __init__(self, **kwargs):
		super(User, self).__init__(**kwargs)

	def __repr__(self):
		return f"User('{self.id}', '{self.firstname}', '{self.lastname}', '{self.role}')"

	def update(self, **kwargs):
		for key, value in kwargs.items():
			setattr(self, key, value)

	@property
	def password(self):
		raise AttributeError('password is not a readable attribute')

	@password.setter
	def password(self, password):
		self.password_hash = generate_password_hash(password)

	def verify_password(self, password):
		return check_password_hash(self.password_hash, password)


class AccessPermissions(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	user_id = db.Column(db.String(16), db.ForeignKey('user.id'))
	role_name = db.Column(db.String(20))
	page_name = db.Column(db.String(64))
	allowed = db.Column(db.Boolean, default=True)


class SubsPayment(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	user_id = db.Column(db.String(16), db.ForeignKey('user.id'))
	membership_type = db.Column(db.String(16))
	amount_paid = db.Column(db.Integer)
	payment_fee = db.Column(db.Integer)
	datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	name = db.Column(db.String(50))
	email = db.Column(db.String(120))
	phone_number = db.Column(db.String(30))
	e_con_name = db.Column(db.String(50))
	e_con_phone = db.Column(db.String(30))
	order_id = db.Column(db.String(192))
	payment_id = db.Column(db.String(192))
	source = db.Column(db.String(6))
	refunded = db.Column(db.Boolean, default=False)


class Subscription(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	user_id = db.Column(db.String(16), db.ForeignKey('user.id'))
	plan = db.Column(db.String(16), db.ForeignKey('subscription_plan.id'))
	active = db.Column(db.Boolean, default=True)
	start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	sub_for = db.Column(db.String(16))
	name = db.Column(db.String(50))
	phone_number = db.Column(db.String(13))
	e_con_name = db.Column(db.String(50))
	e_con_phone = db.Column(db.String(13))
	square_initial_id = db.Column(db.String(48))
	square_continuing_id = db.Column(db.String(48))
	square_env = db.Column(db.String(16))


class SubscriptionPlan(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	name = db.Column(db.String(30))
	amount = db.Column(db.Integer)
	desc = db.Column(db.Text)
	enabled = db.Column(db.Boolean, default=True)
	period = db.Column(db.String(10))
	renewal_month = db.Column(db.Integer)
	plan_id = db.Column(db.String(32))
	initial_variation_id = db.Column(db.String(32))
	continuing_variation_id = db.Column(db.String(32))
	square_env = db.Column(db.String(10))


class BookingModifications(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	ref_num = db.Column(db.Integer)
	from_item = db.Column(db.Text)
	change_quantity = db.Column(db.Integer)
	to_item = db.Column(db.Text)
	is_reservation = db.Column(db.Boolean, default=False)
	mark_as_paid = db.Column(db.Text)
	note = db.Column(db.Text)


class Member(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	firstname = db.Column(db.String(20))
	lastname = db.Column(db.String(30))
	associated_user = db.Column(db.String(16), db.ForeignKey('user.id'))

	member_show_link = db.relationship('MemberShowLink', backref='member', lazy=True)

	def __repr__(self):
		return f"Member('{self.id}', '{self.firstname}', '{self.lastname}', '{self.associated_user}')"


class MemberShowLink(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	cast_or_crew = db.Column(db.String(16))
	role_name = db.Column(db.Text)
	member_id = db.Column(db.String(16), db.ForeignKey('member.id'))
	order_val = db.Column(db.Integer)

	# show = db.relationship('Show', backref='member_show_link', lazy=True)

	def __repr__(self):
		return f"MSL('{self.id}', '{self.show_id}', '" \
			f"{self.cast_or_crew}', '{self.role_name}', '{self.member_id}', {self.order_val})"


class BlogPost(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	title = db.Column(db.Text, nullable=False)
	category = db.Column(db.Text, nullable=False)
	content = db.Column(db.Text, nullable=False)
	author = db.Column(db.String(40), db.ForeignKey('user.id'))
	views = db.Column(db.Integer, default=0)

	def __repr__(self):
		return f"BlogPost('{self.id}', '{self.date}', '{self.title}', '{self.category}', '{self.content}', '{self.author}')"

	def get_dict(self):
		post_dict = {
			"id": self.id,
			"date": self.date,
			"title": self.title,
			"category": self.category,
			"content": self.content,
			"author": self.author
		}
		return post_dict


class BlogImage(db.Model):
	blog_id = db.Column(db.String(16), primary_key=True)
	image_no = db.Column(db.Integer, primary_key=True)
	image = db.Column(db.PickleType)

	def __repr__(self):
		return f"BlogImage('{self.blog_id}', '{self.image_no}', '{self.image}')"


@login_manager.user_loader
def load_user(user_id):
	return User.query.filter_by(id=str(user_id)).first()


class Show(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	season = db.Column(db.String(8))
	show_type = db.Column(db.Text)
	title = db.Column(db.Text)
	subtitle = db.Column(db.Text)
	genre = db.Column(db.Text)
	author = db.Column(db.Text)
	programme = db.Column(db.Text)
	banner = db.Column(db.Text)
	text_blob = db.Column(db.Text)
	noda_review = db.Column(db.Text)
	radio_audio = db.Column(db.Text)

	member_show_link = db.relationship('MemberShowLink', backref='show', lazy=True)
	show_photos = db.relationship('ShowPhotos', backref='show', lazy=True)
	performance = db.relationship('Performance', backref='show', lazy=True)
	# files = db.relationship('Files', backref='show', lazy=True)

	def __repr__(self):
		return f"Show('{self.id}', '{self.date}', '{self.season}', '{self.show_type}', '{self.title}', " \
				f"'{self.subtitle}', '{self.genre}', '{self.author}', '{self.programme}', '{self.text_blob}', " \
				f"'{self.noda_review}', '{self.radio_audio}')"


class ShowPhotos(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	photo_url = db.Column(db.Text)
	photo_type = db.Column(db.String(30))
	photo_desc = db.Column(db.Text)
	cache_url = db.Column(db.Text)
	cache_expires = db.Column(db.DateTime)

	def __repr__(self):
		return f"ShowPhotos('{self.id}', '{self.show_id}', '{self.photo_url}', '{self.photo_type}', '{self.photo_desc}')"


class ShowImage(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	filename = db.Column(db.Text)
	height = db.Column(db.Integer)
	width = db.Column(db.Integer)
	reduced_height = db.Column(db.Integer)
	reduced_width = db.Column(db.Integer)
	order_value = db.Column(db.Integer, default=0)
	featured = db.Column(db.Boolean, default=False)


class ShowImageData(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	full_image = deferred(db.Column(db.LargeBinary))
	reduced_image = deferred(db.Column(db.LargeBinary))


class Performance(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	layout = db.Column(db.JSON)
	seat_assignments = db.Column(db.JSON)

	def get_date_string(self):
		perf_day = int(self.date.strftime("%d"))
		perf_hour = str(int(self.date.strftime("%I")))
		perf_date = self.date.strftime("%a ") + str(perf_day) + {1: 'st', 2: 'nd', 3: 'rd'}.get(perf_day % 20, 'th') + self.date.strftime(" %B ") + perf_hour + self.date.strftime(":%M%p").lower()
		return perf_date


class StaticMedia(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	item_id = db.Column(db.Text)
	filename = db.Column(db.Text)
	item_type = db.Column(db.String(30))
	item_dim = db.Column(db.Text)
	cache_url = db.Column(db.Text)
	cache_expires = db.Column(db.DateTime)
	small_content = db.Column(db.LargeBinary)
	content = db.Column(db.LargeBinary)


class AnalyticsLog(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	server = db.Column(db.Text)
	session_id = db.Column(db.Text)
	session_email = db.Column(db.Text)
	request_origin = db.Column(db.Text)
	request_destination = db.Column(db.Text)
	user_agent = db.Column(db.Text)
	code = db.Column(db.Integer)


class Scheduler(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	target_endpoint = db.Column(db.Text)
	enabled = db.Column(db.Boolean)
	is_running = db.Column(db.Boolean)
	last_response_code = db.Column(db.Integer)
	last_execution = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	interval = db.Column(db.Interval)
	next_execution = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

	scheduler_log = db.relationship('SchedulerLog', backref='Scheduler', lazy=True)


class SchedulerLog(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	job_id = db.Column(db.String(16), db.ForeignKey('scheduler.id'))
	datetime = db.Column(db.DateTime)
	response_code = db.Column(db.Integer)
	response_json = db.Column(db.Text)


class ErrorLog(db.Model, NewIdGetter):
	id = db.Column(db.String(16), primary_key=True)
	datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	path = db.Column(db.Text)
	request = db.Column(db.JSON)
	stacktrace = db.Column(db.Text)
