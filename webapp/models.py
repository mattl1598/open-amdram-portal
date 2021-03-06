from datetime import datetime
from webapp import db
from webapp import login_manager
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class KeyValue(db.Model):
	key = db.Column(db.String(32), primary_key=True)
	value = db.Column(db.Text)

	def __repr__(self):
		return f"KeyValue('{self.key}','{self.value}')"


class Files(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16))
	name = db.Column(db.String(40))
	content = db.Column(db.LargeBinary)


class Post(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	type = db.Column(db.String(16))
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	author = db.Column(db.String(16), db.ForeignKey('user.id'))
	title = db.Column(db.String(40))
	content = db.Column(db.Text)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow())


class User(UserMixin, db.Model):
	id = db.Column(db.String(16), primary_key=True)
	firstname = db.Column(db.String(20))
	lastname = db.Column(db.String(30))
	email = db.Column(db.String(120), unique=True)
	otp_secret = db.Column(db.String(32))
	password_hash = db.Column(db.String(128))
	password = db.Column(db.String(60))
	role = db.Column(db.String(30))
	post = db.relationship('BlogPost', backref='user', lazy=True)
	member = db.relationship('Member', backref='user', lazy=True)

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


class Member(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	firstname = db.Column(db.String(20))
	lastname = db.Column(db.String(30))
	associated_user = db.Column(db.String(16), db.ForeignKey('user.id'))

	member_show_link = db.relationship('MemberShowLink', backref='member', lazy=True)

	def __repr__(self):
		return f"Member('{self.id}', '{self.firstname}', '{self.lastname}', '{self.associated_user}')"


class MemberShowLink(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	cast_or_crew = db.Column(db.String(16))
	role_name = db.Column(db.Text)
	member_id = db.Column(db.String(16), db.ForeignKey('member.id'))


class BlogPost(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow())
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


class Show(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow())
	season = db.Column(db.String(8))
	show_type = db.Column(db.Text)
	title = db.Column(db.Text)
	subtitle = db.Column(db.Text)
	genre = db.Column(db.Text)
	author = db.Column(db.Text)
	programme = db.Column(db.Text)
	images_folder = db.Column(db.Text)
	gallery_link = db.Column(db.Text)

	member_show_link = db.relationship('MemberShowLink', backref='show', lazy=True)
	show_photos = db.relationship('ShowPhotos', backref='show', lazy=True)
	# files = db.relationship('Files', backref='show', lazy=True)


class ShowPhotos(db.Model):
	id = db.Column(db.String(16), primary_key=True)
	show_id = db.Column(db.String(16), db.ForeignKey('show.id'))
	photo_url = db.Column(db.Text)
	photo_type = db.Column(db.String(30))
	photo_desc = db.Column(db.Text)

