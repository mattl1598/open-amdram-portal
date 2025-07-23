import io
import json
import time
import urllib
import math
from time import sleep
from datetime import datetime, timedelta

import requests
from corha import corha
from flask_login import current_user, login_required
from PIL import Image
from pprint import pprint

from sqlalchemy import func, update
from sqlalchemy.dialects.postgresql import aggregate_order_by

from webapp.models import KeyValue, Show, ShowImage, ShowImageData, ShowPhotos, StaticMedia, db
from flask import current_app as app, Response
from flask import abort, Blueprint, redirect, render_template, url_for, request, session, jsonify, make_response, copy_current_request_context, send_file

from webapp.photos_routes import get_albums, get_photo, update_access_token
from webapp.react_permissions import check_page_permission

bp = Blueprint("react_photos_routes", __name__)


@bp.get("/members/admin/manage_media")
def manage_media():
	check_page_permission("admin")

	thumbs = list(db.session.query(
		func.coalesce(
			func.json_agg(
				aggregate_order_by(
					func.json_build_array(
						StaticMedia.id,
						func.concat("/media/", StaticMedia.id, "/", StaticMedia.filename),
						StaticMedia.filename
					),
					StaticMedia.date.desc()
				)
			),
			'[]'
		)
	).scalar())

	data = {
		"type": "manage_media",
		"title": "Manage Media",
		"media": thumbs
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/manage_media/modernise")
def modernise():
	check_page_permission("admin")
	media = db.session.query(
		StaticMedia
	).filter(
		StaticMedia.id == request.form.get("id"),
		StaticMedia.filename == request.form.get("filename")
	).first_or_404()

	url = get_photo(request.form.get("id"), filename=request.form.get("filename"), modernise="media").location
	r = requests.get(url)
	im = Image.open(io.BytesIO(r.content))

	b_out = io.BytesIO()
	b_out_small = io.BytesIO()

	max_width, max_height = 400, 400
	scale_factor = min(max_width / im.width, max_height / im.height)
	new_size = (int(im.width * scale_factor), int(im.height * scale_factor))

	im.save(b_out, format="webp")
	# Resize the image to the new dimensions
	im = im.resize(new_size, Image.Resampling.LANCZOS)
	im.save(b_out_small, format="webp")

	media.content = b_out.getvalue()
	media.small_content = b_out_small.getvalue()

	db.session.commit()

	return {"code": 200, "msg": "Success"}


@bp.post("/members/api/manage_media/delete")
def delete_static_media():
	check_page_permission("admin")
	media_db = StaticMedia.query.filter_by(id=request.form.get("id")).first()
	StaticMedia.query.filter_by(id=request.form.get("id")).delete()
	update_access_token()
	albums = {b: a for (a, b) in get_albums()}

	if "OADP_DELETE_ME" in albums.keys():
		album_id = albums.get("OADP_DELETE_ME")
	else:
		x = requests.post(
			url=f"https://photoslibrary.googleapis.com/v1/albums?access_token={session.get('access_token')}",
			json={
				"album": {
					"title": "OADP_DELETE_ME"
				}
			}
		)

		album_id = x.json().get("id")
	requests.post(
		url=f"https://photoslibrary.googleapis.com/v1/albums/{album_id}:batchAddMediaItems"
			f"?access_token={session.get('access_token')}",
		json={
			"mediaItemIds": [
				media_db.item_id
			]
		}
	)

	db.session.commit()

	return {
		"code": 200,
		"msg": "Item deleted successfully."
	}


@bp.post("/members/api/manage_media/upload")
def upload_static_media(**kwargs):
	check_page_permission("admin")
	b_in = io.BytesIO()
	if kwargs.get("mammoth") == "true":
		# print("mammoth")
		filename = kwargs.get("image_name").replace(' ', '_')
		b_in = kwargs.get("image")
	else:
		file = request.files.get('fileElem')
		# print(file.content_type)
		filename = file.filename.replace(' ', '_')
		file.save(b_in)

	b_out = io.BytesIO()
	b_out_small = io.BytesIO()
	with Image.open(b_in) as im:
		# Calculate the new dimensions to scale the image
		max_dimension = 400
		scale_factor = max_dimension / max(im.width, im.height)
		new_size = (int(im.width * scale_factor), int(im.height * scale_factor))

		im.save(b_out, format="webp")
		# Resize the image to the new dimensions
		im = im.resize(new_size, Image.ANTIALIAS)
		im.save(b_out_small, format="webp")
		width = im.width
		height = im.height
	


	# update_access_token()
	# url = "https://photoslibrary.googleapis.com/v1/uploads"
	# headers = {
	# 	"Content-type": "application/octet-stream",
	# 	"X-Goog-Upload-Content-Type": "image/webp",
	# 	"X-Goog-Upload-Protocol": "raw"
	# }

	image_data = b_out.getvalue()
	small_image_data = b_out_small.getvalue()

	# x = requests.post(
	# 	url + f"?access_token={session.get('access_token')}",
	# 	headers=headers,
	# 	data=image_data
	# )

	# albums = {b: a for (a, b) in get_albums()}
	#
	# if "OADP_Website_Media" in albums.keys():
	# 	album_id = albums.get("OADP_Website_Media")
	# else:
	# 	x = requests.post(
	# 		url=f"https://photoslibrary.googleapis.com/v1/albums?access_token={session.get('access_token')}",
	# 		json={
	# 			"album": {
	# 				"title": "OADP_Website_Media"
	# 			}
	# 		}
	# 	)
	# 	album_id = x.json().get("id")

	# url = "https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate"
	# headers = {
	# 	"Content-type": "application/json"
	# }
	# data = {
	# 	"albumId": album_id,
	# 	"newMediaItems": [
	# 		{
	# 			"description": "",
	# 			"simpleMediaItem": {
	# 				"fileName": f"{filename.rsplit('.', 1)[0]}.webp",
	# 				"uploadToken": f"{x.content.decode('utf-8')}"
	# 			}
	# 		}
	# 	]
	# }

	# x = requests.post(
	# 	url + f"?access_token={session.get('access_token')}",
	# 	headers=headers,
	# 	data=json.dumps(data)
	# )
	# pprint(x.json())

	new_item = StaticMedia(
		id=StaticMedia.get_new_id(),
		item_id="",
		filename=f"{filename.rsplit('.', 1)[0]}.webp",
		item_type="image/webp",
		item_dim=f"{width},{height}",
		content=image_data,
		small_content=small_image_data
	)

	db.session.add(new_item)
	db.session.commit()

	if kwargs.get("mammoth") == "true":
		# print("mammoth")
		return {
			"path": f"/media/{new_item.id}/{new_item.filename}",
			"filename": f"{new_item.filename}"
		}
	else:
		# return jsonify({
		# 	"success": True,
		# 	"url": f"/media/{new_item.id}/{new_item.filename}",
		# 	"filename": f"{new_item.filename}"
		# })
		return {
			"code": 200,
			"msg": "Image Uploaded Successfully"
		}


@bp.get("/members/admin/set_show_photos")
def set_show_photos():
	check_page_permission("admin")

	update_access_token()
	access_token = session.get('access_token')

	url = "https://photoslibrary.googleapis.com/v1/albums"
	y = requests.get(url + f"?access_token={access_token}&pageSize=50").json()
	# pprint(y)

	albums = []
	next_token = "not none"
	while next_token is not None:
		next_token = y.get('nextPageToken')
		for album in y.get("albums"):
			albums.append((album.get("id"), album.get("title"),))

		y = requests.get(url + f"?access_token={access_token}&pageSize=50&pageToken={next_token}").json()

	shows = db.session.query(
		func.json_agg(aggregate_order_by(func.json_build_object(
			"id", Show.id,
			"title", Show.title,
			"date", Show.date
		), Show.date.desc()))
	).scalar()

	data = {
		"type": "show_photos_form",
		"title": "Update Show Photos",
		"shows": shows,
		"albums": albums,
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/admin/set_show_photos")
def set_show_photos_api():
	update_access_token()
	access_token = session.get('access_token')

	data = {
		"albumId": request.form.get("album"),
		"pageSize": 100,
		"access_token": access_token
	}

	url = f"https://photoslibrary.googleapis.com/v1/mediaItems:search?access_token={access_token}"
	z = requests.post(url, data).json()

	next_token = "not none"
	photos = []
	while next_token is not None:
		for photo in z.get("mediaItems"):
			# print(photo.get("id"))
			photo_tuple = (
				list({"photo", "video"}.intersection(set(photo.get("mediaMetadata").keys())))[0],
				photo.get("id"),
				f"{photo.get('mediaMetadata').get('width')},{photo.get('mediaMetadata').get('height')}",
			)
			# print(photo_tuple)
			photos.append(
				photo_tuple
			)
		# print(len(photos))
		data["pageToken"] = (next_token := z.get("nextPageToken"))
		z = requests.post(url, data).json()

	existing_sql = ShowPhotos.query \
		.filter_by(show_id=request.form.get("show")) \
		.all()

	used_ids = [value[0] for value in ShowPhotos.query.with_entities(ShowPhotos.id).all()]
	existing = set([(i.photo_type, i.photo_url, i.photo_desc,) for i in existing_sql])

	to_remove = existing.difference(set(photos))
	to_add = set(photos).difference(existing)

	for photo in to_add:
		new_photo = ShowPhotos(
			id=(new_ID := corha.rand_string(photo[1], 16, used_ids)),
			show_id=request.form.get("show"),
			photo_url=photo[1],
			photo_type=photo[0],
			photo_desc=photo[2]
		)

		used_ids.append(new_ID)
		db.session.add(new_photo)

	for photo in to_remove:
		ShowPhotos.query \
			.filter_by(
				show_id=request.form.get("show"),
				photo_url=photo[1],
				photo_type=photo[0]
			) \
			.delete()

	db.session.commit()

	return {
		"code": 200,
		"msg": "Album Updated Successfully"
	}


# @bp.route("/photo/<media_id>")
# @bp.route("/video/<media_id>")
# def get_photo(media_id, **kwargs):
# 	pass


@bp.route("/media/<media_id>/<filename>")
def get_static_media(media_id, **kwargs):
	media_item = db.session.query(StaticMedia).filter_by(id=media_id).first_or_404()
	if "lowres" in request.args.keys():
		return Response(media_item.small_content, mimetype="image/webp", headers={
			"Cache-Control": "public, max-age=3600"
		})
	else:
		return Response(media_item.content, mimetype="image/webp", headers={
			"Cache-Control": "public, max-age=3600"
		})


@bp.route("/photo_new/<photo_id>")
def get_image(photo_id):
	if "lowres" in request.args.keys():
		image = db.session.query(
			ShowImageData.reduced_image,
			ShowImage.filename
		).filter_by(id=photo_id).first_or_404()
		return send_file(io.BytesIO(image.reduced_image), download_name=image.filename, mimetype="image/webp", max_age=3600)
	else:
		image = db.session.query(
			ShowImageData.full_image,
			ShowImage.filename
		).filter_by(id=photo_id).first_or_404()
		return send_file(io.BytesIO(image.full_image), download_name=image.filename, mimetype="image/webp", max_age=3600)


@bp.get("/members/manage_shows/photos/<show_id>/<show_title>")
def manage_photos(show_id, show_title):
	photos = db.session.query(
		func.coalesce(func.json_agg(aggregate_order_by(
			func.json_build_object(
				"id", ShowImage.id,
				"filename", ShowImage.filename,
				"rWidth", ShowImage.reduced_width,
				"rHeight", ShowImage.reduced_height,
				"width", ShowImage.width,
				"height", ShowImage.height,
				"order_value", ShowImage.order_value,
				"featured", ShowImage.featured,
			), ShowImage.order_value.asc(), ShowImage.filename.asc())
		), '[]')
	).filter(
		ShowImage.show_id == show_id
	).scalar()

	data = {
		"type": "manage_show_photos",
		"title": f"{show_title} Photos",
		"showID": show_id,
		"photos": photos,
	}

	if "react" in request.args.keys():
		return jsonify(data)
	else:
		data["initialData"] = True
		return render_template(
			"react_template.html",
			data=data
		)


@bp.post("/members/api/set_show_images_order")
def set_show_images_order():
	data = request.json
	db.session.execute(update(ShowImage), data)
	db.session.commit()

	return {
		"code": 200,
		"msg": "Image metadata Updated Successfully"
	}


@bp.post("/members/api/upload_show_image")
def upload_show_images():
	form = request.form
	if 'file' not in request.files:
		return jsonify({"code": 400, "msg": "No file part in the request"}), 400

	file = request.files['file']
	if file.filename == '':
		return jsonify({"code": 400, "msg": "No file selected for uploading"}), 400

	b_in = io.BytesIO(file.read())
	b_out = io.BytesIO()
	b_out_small = io.BytesIO()

	height = 0
	width = 0
	reduced_height = 0
	reduced_width = 0

	with Image.open(b_in) as im:
		width = im.size[0]
		height = im.size[1]
		im.save(b_out, format="webp", optimize=True, quality=80)
		im.thumbnail((400,400,), resample=Image.Resampling.BOX)
		reduced_width = im.size[0]
		reduced_height = im.size[1]
		im.save(b_out_small, format="webp", optimize=True, quality=85)
		
	new_image = ShowImage(
		id=ShowImage.get_new_id(),
		show_id=request.form.get("show_id"),
		filename=file.filename,
		width=width,
		height=height,
		reduced_height=reduced_height,
		reduced_width=reduced_width,
	)

	new_image_data = ShowImageData(
		id=new_image.id,
		full_image=b_out.getvalue(),
		reduced_image=b_out_small.getvalue()
	)

	db.session.add(new_image)
	db.session.add(new_image_data)
	db.session.commit()

	return jsonify({"code": 200, "msg": f"Photo '{file.filename}' uploaded successfully"}), 200
	