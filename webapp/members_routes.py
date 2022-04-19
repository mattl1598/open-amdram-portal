from corha import corha
from flask import abort, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import Member, Show, User, MemberShowLink as MSL


@app.route("/members/dashboard")
@login_required
def dashboard():
	return render_template("members/dashboard.html", css="m_dashboard.css")


@app.route("/members/manage-shows")
def manage_shows():
	shows = Show.query.order_by(Show.date.desc()).all()
	return render_template(
		"past_shows.html",
		manage_shows=True,
		shows=shows,
		css="past_shows.css",
		js="past_shows.js"
	)


@app.route("/members/edit-show/<show_id>", methods=["GET", "POST"])
def edit_show(show_id):
	if request.method == "GET":
		members = Member.query.all()
		crew_roles = MSL.query\
			.filter_by(cast_or_crew="crew")\
			.with_entities(MSL.role_name)\
			.distinct()\
			.all()

		modules = {
			"vue": True,
			"tom-select": True
		}
		return render_template(
			"members/edit_show.html",
			members=members,
			crew_roles=crew_roles,
			css="edit_show.css",
			js="past_show_form.js",
			modules=modules
		)


@app.route("/members/add-show-member", methods=["GET", "POST"])
def add_show_member():
	if request.method == "GET":
		members = Member.query.all()
		return render_template(
			"members/add_show_member.html",
			members=members,
			css="add_new_members.css"
		)
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


@app.route("/members/vue-test")
def vue_test():
	return render_template(
		"members/vue-test.html",
		css="m_dashboard.css"#,
		# js="vue_test.js"
	)


@app.route("/members/logout")
def logout():
	logout_user()
	return redirect(url_for("frontpage"))
