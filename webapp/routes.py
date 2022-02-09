from flask import abort, make_response, redirect, render_template, send_file, url_for
from webapp import app
import json


@app.route("/")
def frontpage():
	return "Hello World"
