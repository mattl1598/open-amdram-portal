from os import walk

import markdown as markdown
from flask import Flask  # , session
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from sass import compile
import corha
import os
import subprocess

app = Flask(__name__)

output = subprocess.run([
				'git', '-C', os.getcwd(),
				'rev-parse', '--short', 'HEAD'
			], capture_output=True)
print(commit := output.stdout.decode('UTF-8').strip('\r\n'))
output = subprocess.run(['git', 'describe', '--tags'], capture_output=True)
print(tag := output.stdout.decode('UTF-8').strip('\r\n'))

# repo = Repo(os.getcwd())
# print(repo)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.envs = corha.credentials_loader(".env")

app.config['commit'] = commit
app.config['tag'] = tag
app.config['SECRET_KEY'] = app.envs.secret_key
app.config['FLASK_ENV'] = "development"
app.config['SQLALCHEMY_DATABASE_URI'] = app.envs.postgresql
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 5 * 1000 * 1000
db = SQLAlchemy(app)

# get available sounds
app.sounds_path = "static/sounds/"
for (_, _, app.available_sounds) in walk("webapp/" + app.sounds_path):
	print(app.available_sounds)
	break


# TODO move to env file
app.config['g_client_id'] = "1038842806205-nfa619btg2u0vq5pv572i2nl6jjtd07a.apps.googleusercontent.com"
app.config['g_client_secret'] = "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"

compile(dirname=("webapp/static/scss/", "webapp/static/css/"), output_style="compressed")

app.jinja_env.globals.update(
	md=markdown.markdown,
	str=str,
	len=len
)

# TODO investigate circular imports in flask
from webapp import routes, members_routes, photos_routes, analytics_routes

# from webapp import models
# db.create_all()
