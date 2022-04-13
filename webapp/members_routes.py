from corha import corha
from flask import abort, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import Member, User


@app.route("/members/dashboard")
@login_required
def dashboard():
	return render_template("members/dashboard.html", css="m_dashboard.css")


@app.route("/members/add-show-member", methods=["GET", "POST"])
def add_show_member():
	if request.method == "GET":
		return render_template("members/add_show_member.html", css="m_dashboard.css")
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
