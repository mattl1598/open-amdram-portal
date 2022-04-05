from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from sass import compile
import corha
# import os

app = Flask(__name__)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.envs = corha.credentials_loader(".env")

app.config['SECRET_KEY'] = app.envs.secret_key
app.config['FLASK_ENV'] = "development"
app.config['SQLALCHEMY_DATABASE_URI'] = app.envs.postgresql
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

compile(dirname=("webapp/static/scss/", "webapp/static/css/"), output_style="compressed")

from webapp import routes, members_routes
#
# from webapp import models
# db.create_all()
