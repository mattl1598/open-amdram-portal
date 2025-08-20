from sqlalchemy import func, literal_column, or_
from webapp.models import *

from flask import abort, Blueprint, flash, make_response, redirect, render_template, send_file, session, url_for, \
	request, jsonify, current_app as app

bp = Blueprint("react_face_detection", __name__)


# @bp.post("/api/getFaces")
# def get_faces():
# 	faces = db.session.query(
# 		func.json_object_agg(Face.id, func.row_as_json(Face))
# 	).filter(Face.photo_id == request.json.get("photoID")).scalar()
# 	return jsonify(faces)


@bp.post("/api/getSavedFaces")
def get_saved_faces():
	faces = db.session.query(
		func.coalesce(
			func.json_agg(func.row_to_json(literal_column('face')))
			, '[]'
		)
	).filter(Face.photo_id == request.json.get("photoID")).scalar()
	return jsonify(faces)


@bp.post("/api/getNullFaces")
def get_face():
	faces = db.session.query(
		func.coalesce(
			func.json_agg(func.row_to_json(literal_column('face')))
			, '[]'
		)
	).select_from(Face).join(
		ShowImage, ShowImage.id == Face.photo_id
	).filter(
		ShowImage.show_id == request.json.get("showID"),
		or_(Face.member_id.is_(None), Face.member_id == ""),
	).scalar()
	return jsonify(faces)


@bp.post("/api/setFaceMember")
def set_member_face():
	face = db.session.get(Face, request.json.get("faceID"))
	face.member_id = None
	if member_id := request.json.get("memberID"):
		face.member_id = member_id
	db.session.commit()
	return {
		"success": True
	}


@bp.post("/api/deleteFace")
def delete_face():
	face = db.session.get(Face, request.json.get("faceID"))
	db.session.delete(face)
	db.session.commit()
	return {
		"success": True
	}