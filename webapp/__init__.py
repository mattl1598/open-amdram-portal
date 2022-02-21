from flask import Flask
import os

app = Flask(__name__)

nav = [
	("Home", "/",),
	("Blog", "/blog",),
	("Past Shows", "/past-shows",),
	("Auditions", "/auditions",),
	("About Us", "/about-us",),
	("Members", "/members",),
]

from webapp import routes
