import base64
from pprint import pprint
from io import BytesIO

from sqlalchemy import func, literal_column, or_
from PIL import Image
from collections import Counter

from webapp.models import MemberShowLink as MSL
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


if False:  # app.envs.face_recognition
	from deepface import DeepFace

	@bp.post("/api/face_detection/analyse")
	def analyse():
		bad_faces = []
		photo = Image.open(BytesIO(db.session.query(
			ShowImageData.full_image
		).filter(ShowImageData.id == request.json.get("photoID")).scalar()))
		show_id = db.session.query(
			ShowImage.show_id
		).filter(
			ShowImage.id == request.json.get("photoID")
		).scalar()

		# Scale down the image if needed while maintaining its aspect ratio
		max_size = 1000
		ratio = 1
		if not request.args.get("fullRes") and (photo.width > max_size or photo.height > max_size):
			ratio = min(max_size / photo.width, max_size / photo.height)
			new_size = (int(photo.width * ratio), int(photo.height * ratio))
			small_photo = photo.resize(new_size, Image.Resampling.BOX)
		else:
			small_photo = photo.copy()

		buffered = BytesIO()
		small_photo.save(buffered, format="PNG")
		small_photo_b64 = 'data:image/png;base64,' + str(base64.b64encode(buffered.getvalue()))[2:-1]
		buffered.close()

		analysis = DeepFace.represent(
				small_photo_b64,
				model_name="Facenet",
				enforce_detection=False,
				detector_backend="mtcnn"
			)

		cast = db.session.query(
			func.coalesce(
				func.json_agg(
					func.distinct(MSL.member_id)
				),
				'[]'
			)
		).filter(
			MSL.show_id == show_id,
			MSL.cast_or_crew == "cast"
		).scalar()

		for i in range(0, len(analysis)):
			face = analysis[i]
			if face.get("face_confidence") < 0.1:
				bad_faces.append(i)
			else:
				del analysis[i]["facial_area"]["left_eye"]
				del analysis[i]["facial_area"]["right_eye"]
				for key, value in face.get("facial_area").items():
					analysis[i]["facial_area"][key] = value / ratio
				area = analysis[i]["facial_area"]
				cropped_face = BytesIO()
				crop = photo.crop(
					(area.get("x"), area.get("y"), area.get("x") + area.get("w"), area.get("y") + area.get("h"))
				)
				crop.save("C:/Users/mattl/Desktop/test.png", format="PNG")
				crop.save(cropped_face, format="PNG")
				bytes_value = cropped_face.getvalue()
				cropped_face.close()
				b64 = 'data:image/png;base64,' + str(base64.b64encode(bytes_value))[2:-1]
				face = DeepFace.represent(
					b64,
					model_name="Facenet",
					detector_backend="mtcnn",
					enforce_detection=False,
					max_faces=1
				)
				if len(face) == 0:
					bad_faces.append(i)
				else:
					analysis[i]["embedding"] = face[0].get("embedding")

		count = 0

		for i in range(0, len(analysis)):
			if i not in bad_faces:
				face = analysis[i]
				distance = Face.descriptor.l2_distance(face.get("embedding"))
				results = db.session.query(
					Face.member_id,
					Face.descriptor,
					Member.firstname + " " + Member.lastname,
					distance.label('distance')
				).filter(
					Face.photo_id != request.json.get("photoID"),
					Face.member_id != None,
					Face.member_id.in_(cast)
				).order_by(
					'distance'
				).join(
					Member, Member.id == Face.member_id
				).limit(10)
				face["guess"] = None

				# for result in results:
				# 	print(result[0], result[2], result[3])

				member_ids = [result[0] for result in results]
				if member_ids:
					counter = Counter(member_ids)
					most_common = max(counter.items(), key=lambda x: (x[1], -member_ids.index(x[0])))
					# face["guess"] = most_common[0]

					matching_result = next((r for r in results if r[0] == most_common[0]), None)
				else:
					matching_result = None
				if matching_result:
					verification = DeepFace.verify(
						face.get("embedding"),
						matching_result.descriptor.tolist(),
						model_name="Facenet",
						distance_metric="cosine",
						silent=True
					)
					# print(verification)
					if verification.get("verified") and verification.get("confidence") > 50:
						new_face = Face(
							id=Face.get_new_id(),
							photo_id=request.json.get("photoID"),
							member_id=matching_result[0],
							score=face.get("face_confidence"),
							descriptor=face.get("embedding"),
							**face.get("facial_area")
						)
						db.session.add(new_face)
					else:
						new_face = Face(
							id=Face.get_new_id(),
							photo_id=request.json.get("photoID"),
							member_id=None,
							score=face.get("face_confidence"),
							descriptor=face.get("embedding"),
							**face.get("facial_area")
						)
						db.session.add(new_face)
				else:
					new_face = Face(
						id=Face.get_new_id(),
						photo_id=request.json.get("photoID"),
						member_id=None,
						score=face.get("face_confidence"),
						descriptor=face.get("embedding"),
						**face.get("facial_area")
					)
					db.session.add(new_face)
					count += 1

		db.session.commit()

		return jsonify({
			"code": 200,
			"msg": "Success",
			"face_count": count
		})


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