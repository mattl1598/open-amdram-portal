from flask_login import current_user
from sqlalchemy import func
from flask import abort, Blueprint, current_app as app, jsonify, render_template, request

from webapp.models import AccessPermissions, db, Member, MemberShowLink as MSL


bp = Blueprint("react_permissions", __name__)


@bp.app_errorhandler(400)
@bp.app_errorhandler(403)
@bp.app_errorhandler(404)
@bp.app_errorhandler(500)
def react_error(e):
	data = {
		"type": "error",
		"code": e.code,
		"title": f"{e.code} {e.name}",
		"content": e.description
	}
	print(data)
	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


def default_role_permissions():
	defaultNavRoles = {
		"member": {
			"dashboard": True,
			"shows": True,
			"shows_write": False,
			"blog": False,
			"get_subs": False,
			"bookings": False,
			"admin": False,
			"member_docs": True,
			"account_settings": True,
			"help": True,
			"logout": True
		},
		"author": {
			"dashboard": True,
			"shows": True,
			"shows_write": False,
			"blog": True,
			"get_subs": False,
			"bookings": False,
			"admin": False,
			"member_docs": True,
			"account_settings": True,
			"help": True,
			"logout": True
		},
		"admin": {
			"dashboard": True,
			"shows": True,
			"shows_write": True,
			"blog": True,
			"get_subs": True,
			"bookings": True,
			"admin": True,
			"member_docs": True,
			"account_settings": True,
			"help": True,
			"logout": True
		},
	}

	return defaultNavRoles


def check_page_permission(page_name, show_id=None):
	defaultRoles = default_role_permissions()

	if show_id:
		directors = db.session.query(
			func.array_to_json(func.array_agg(Member.associated_user))
		).join(
			MSL, MSL.member_id == Member.id
		).filter(
			MSL.role_name.in_(["Director", "Producer"]),
			MSL.cast_or_crew == "crew",
			MSL.show_id == show_id,
			Member.associated_user.is_not(None)
		).scalar() or []
	else:
		directors = []

	if current_user.role in defaultRoles.keys():
		role_permissions_default = defaultRoles[current_user.role]
	else:
		role_permissions_default = defaultRoles["member"]

	role_permissed = db.session.query(
		AccessPermissions.allowed
	).filter(
		AccessPermissions.page_name == page_name,
		AccessPermissions.role_name == current_user.role,
	).limit(1).scalar()
	user_permissed = db.session.query(
		AccessPermissions.allowed
	).filter(
		AccessPermissions.page_name == page_name,
		AccessPermissions.user_id == current_user.id,
	).limit(1).scalar()

	allowed = 0

	if (default_permission := role_permissions_default.get(page_name)) is not None:
		allowed = default_permission
	if role_permissed is not None:
		allowed = role_permissed
	if user_permissed is not None:
		allowed = user_permissed

	if not allowed and (current_user.id not in directors and show_id):
		abort(403)


def get_allowed_pages():
	defaultNavRoles = default_role_permissions()

	if current_user.role in defaultNavRoles.keys():
		navItemsToShow = defaultNavRoles[current_user.role]
	else:
		navItemsToShow = defaultNavRoles["member"]
	if current_user.role:
		# collect role based permissions from database
		role_perms = db.session.query(
			func.json_object_agg(
				AccessPermissions.page_name, AccessPermissions.allowed
			)
		).filter(
			AccessPermissions.role_name == current_user.role,
			AccessPermissions.allowed.is_not(None)
		).scalar()
		# update allowed nav items dictionary with role based permissions
		navItemsToShow.update(role_perms or {})

	# collect user based permissions from database
	user_perms = db.session.query(
		func.json_object_agg(
			AccessPermissions.page_name, AccessPermissions.allowed
		)
	).filter(
		AccessPermissions.user_id == current_user.id,
		AccessPermissions.allowed.is_not(None)
	).scalar()

	# update allowed nav items dictionary with user based permissions
	navItemsToShow.update(user_perms or {})

	return navItemsToShow
