from flask import abort, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import User


@app.route("/members/dashboard")
@login_required
def dashboard():
	return render_template("members/dashboard.html", css="m_dashboard.css")
