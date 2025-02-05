import io
import json
import time
import urllib
import math
from time import sleep
from datetime import datetime, timedelta

from flask_login import current_user, login_required
from PIL import Image
from pprint import pprint

import requests
from corha import corha
from flask import abort, Blueprint, redirect, render_template, url_for, request, session, jsonify, make_response, copy_current_request_context
from webapp.models import KeyValue, Show, ShowPhotos, StaticMedia, db
from flask import current_app as app
from sqlalchemy import or_
bp = Blueprint("photos_routes", __name__)


def get_albums():
	url = "https://photoslibrary.googleapis.com/v1/albums"
	y = requests.get(url + f"?access_token={session.get('access_token')}&pageSize=50").json()

	albums = []
	next_token = "not none"
	while next_token is not None:
		next_token = y.get('nextPageToken')
		for album in y.get("albums"):
			albums.append((album.get("id"), album.get("title"),))

		y = requests.get(url + f"?access_token={session.get('access_token')}&pageSize=50&pageToken={next_token}").json()

	return albums


def update_access_token():
	if session.get("access_token") is not None and session.get("access_token_expires") > int(time.time()):
		session["access_token"] = session.get("access_token")
		session["access_token_expires"] = session.get("access_token_expires")
		session.modified = True
	else:
		refresh_token = KeyValue.query.filter_by(key="refresh_token").first().value
		url = "https://oauth2.googleapis.com/token"
		data = {
			"refresh_token": refresh_token,
			"client_id": app.config['g_client_id'],
			"client_secret": app.config['g_client_secret'],
			"grant_type": "refresh_token"
		}
		# x = app.requests_session.post(url=url, data=data).json()
		x = requests.post(url=url, data=data).json()
		# pprint(x)
		session["access_token"] = x.get("access_token")
		session["access_token_expires"] = int(x.get("expires_in")) + int(time.time())
		session.modified = True


def batch_get(item_ids):
	update_access_token()
	item_ids = list(item_ids)
	id_lists = []
	max_len = 50
	for i in range(math.ceil(len(item_ids) / max_len)):
		if i * max_len + max_len < len(item_ids):
			id_lists.append(item_ids[i * max_len:i * max_len + max_len])
		else:
			id_lists.append(item_ids[i * max_len:])
	outputA = {}
	for id_list in id_lists:
		headers = {"Authorization": f"Bearer {session.get('access_token')}"}

		url = f"https://photoslibrary.googleapis.com/v1/mediaItems:batchGet"
		params = f"?fields=mediaItemResults(mediaItem(id,baseUrl)){'&mediaItemIds='.join([''] + id_list)}&access_token={session.get('access_token')}"
		x = requests.get(url=url+params).json()
		for y in x.get("mediaItemResults") or []:
			if (item := y.get("mediaItem")) is not None:
				outputA[item.get("id")] = item.get("baseUrl") + "?d"

	return outputA


def batch_get_show_media(show_id, media_type):
	now = datetime.utcnow()
	item_ids = {
		i[1]: i[0]
		for i in ShowPhotos.query
			.filter(or_(ShowPhotos.cache_expires < now, ShowPhotos.cache_expires.is_(None)))
			.filter_by(show_id=show_id, photo_type=media_type)
			.order_by(ShowPhotos.id.asc())
			.with_entities(ShowPhotos.id, ShowPhotos.photo_url)
			.all()
	}
	cached_items = {
		i[0]: i[1]
		for i in ShowPhotos.query
			.filter(ShowPhotos.cache_expires >= now)
			.filter_by(show_id=show_id, photo_type=media_type)
			.order_by(ShowPhotos.id.asc())
			.with_entities(ShowPhotos.id, ShowPhotos.cache_url)
			.all()
	}
	new = batch_get(item_ids.keys())
	for item in new.items():
		photo = ShowPhotos.query.get(item_ids.get(item[0]))
		if photo is not None:
			photo.cache_url = item[1]
			photo.cache_expires = now
	db.session.commit()
	return cached_items | new


# @app.route("/phototest")
# @login_required
# def phototest():
# 	return jsonify(batch_get_show_media("2ExG1dp2H77RpEd", "photo"))


# @bp.route("/members/admin/manage_media", methods=["POST", "GET"])
# @login_required
def manage_media(**kwargs):
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	if request.method == "POST" or kwargs.get("mammoth") == "true":
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
		if filename.rsplit('.', 1)[1] != "webp":
			b_out = io.BytesIO()
			with Image.open(b_in) as im:
				im.save(b_out, format="webp")
		else:
			b_out = b_in

		update_access_token()

		url = "https://photoslibrary.googleapis.com/v1/uploads"
		headers = {
			"Content-type": "application/octet-stream",
			"X-Goog-Upload-Content-Type": "image/webp",
			"X-Goog-Upload-Protocol": "raw"
		}

		x = requests.post(
			url + f"?access_token={session.get('access_token')}",
			headers=headers,
			data=b_out.getvalue()
		)

		albums = {b: a for (a, b) in get_albums()}

		if "OADP_Website_Media" in albums.keys():
			album_id = albums.get("OADP_Website_Media")
		else:
			x = requests.post(
				url=f"https://photoslibrary.googleapis.com/v1/albums?access_token={session.get('access_token')}",
				json={
					"album": {
						"title": "OADP_Website_Media"
					}
				}
			)
			album_id = x.json().get("id")

		url = "https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate"
		headers = {
			"Content-type": "application/json"
		}
		data = {
			"albumId": album_id,
			"newMediaItems": [
				{
					"description": "",
					"simpleMediaItem": {
						"fileName": f"{filename.rsplit('.', 1)[0]}.webp",
						"uploadToken": f"{x.content.decode('utf-8')}"
					}
				}
			]
		}

		x = requests.post(
			url + f"?access_token={session.get('access_token')}",
			headers=headers,
			data=json.dumps(data)
		)
		# pprint(x.json())

		new_item = StaticMedia(
			id=StaticMedia.get_new_id(),
			item_id=x.json()["newMediaItemResults"][0]["mediaItem"]["id"],
			filename=x.json()["newMediaItemResults"][0]["mediaItem"]["filename"],
			item_type=x.json()["newMediaItemResults"][0]["mediaItem"]["mimeType"],
			item_dim=",".join(
				[
					x.json()["newMediaItemResults"][0]["mediaItem"]["mediaMetadata"][i]
					for i in ["width", "height"]
				]
			)
		)

		db.session.add(new_item)
		db.session.commit()

		if kwargs.get("mammoth") == "true":
			# print("mammoth")
			return {
				"path": f"/media/{new_item.id}/{new_item.filename}",
				"filename": f"{new_item.filename}"
			}
		elif request.args.get("api") == "true":
			return jsonify({
				"success": True,
				"url": f"/media/{new_item.id}/{new_item.filename}",
				"filename": f"{new_item.filename}"
			})
		else:
			# print("direct")
			return redirect(request.referrer)
	else:
		if "delete" in request.args.keys():
			media_db = StaticMedia.query.filter_by(id=request.args.get("delete")).first()
			StaticMedia.query.filter_by(id=request.args.get("delete")).delete()

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

			return redirect(request.referrer)
		else:
			media_db = StaticMedia.query.all()

		if len(media_db):
			media_ids = {
				f"{x.item_id}": f"{x.id}"
				for x in media_db
			}

			update_access_token()

			url = f"https://photoslibrary.googleapis.com/v1/mediaItems:batchGet?mediaItemIds="
			url += f"{'&mediaItemIds='.join(media_ids.keys())}"
			url += f"&access_token={session.get('access_token')}"

			x = requests.get(url)

			thumbs = [
				(
					media_ids[i["mediaItem"]["id"]],
					f'{i["mediaItem"]["baseUrl"]}=d',
					i["mediaItem"]["filename"],
				)
				for i in x.json()["mediaItemResults"]
			]

		else:
			thumbs = []

		return render_template(
			"members/upload_media.html",
			thumbs=thumbs,
			css="manage_media.css",
			js="manage_media.js"
		)


# @bp.route("/media/<media_id>/<filename>")
@bp.route("/photo/<media_id>")
@bp.route("/video/<media_id>")
def get_photo(media_id, **kwargs):
	route = request.url_rule.rule[1:].split("/")[0]
	refresh = "refresh" in request.args.keys()

	# start = time.time()
	update_access_token()

	if route in ["photo", "video"]:
		item = ShowPhotos.query.filter(or_(ShowPhotos.id == media_id, ShowPhotos.photo_url == media_id)).first_or_404()
		if not refresh and item.cache_expires and item.cache_url and item.cache_expires > datetime.now():
			return redirect(item.cache_url)

		url = f"https://photoslibrary.googleapis.com/v1/mediaItems/{item.photo_url}?access_token={session.get('access_token')}&fields=baseUrl"
		# x = app.requests_session.get(url=url).json()
		x = requests.get(url=url).json()
		if x.get('baseUrl') is not None:
			new_base_url = "/"
			if route == "photo":
				new_base_url = f"{x.get('baseUrl')}=d"
			elif route == "video":
				new_base_url = f"{x.get('baseUrl')}=dv"

			response = redirect(
				new_base_url
			)

			@response.call_on_close
			@copy_current_request_context
			def process_after_request():
				if new_base_url != item.cache_url:
					item.cache_url = new_base_url
					item.cache_expires = datetime.now() + timedelta(minutes=45)
				else:
					item.cache_expires = item.cache_expires + timedelta(minutes=1)
				db.session.add(item)
				db.session.commit()

			return response
		else:
			abort(404)
	elif route == "media" or kwargs["modernise"] == "media":
		# pprint(time.time()-start)
		item = StaticMedia.query.filter_by(id=media_id, filename=kwargs["filename"]).first_or_404()
		if not refresh and item.cache_expires and item.cache_url and item.cache_expires > datetime.now():
			return redirect(item.cache_url)
		else:
			# pprint(time.time()-start)
			url = f"https://photoslibrary.googleapis.com/v1/mediaItems/{item.item_id}?" \
				f"access_token={session.get('access_token')}"
			# pprint(time.time()-start)
			# print(url)
			# x = app.requests_session.get(url=url).json()
			x = requests.get(url=url).json()
			# response = urllib.request.urlopen(url)
			# data = response.read()
			# x = json.loads(data)
			# pprint(time.time()-start)
			if x.get('baseUrl') is not None:
				new_base_url = f"{x.get('baseUrl')}=d"
				response = redirect(
					new_base_url
				)

				@response.call_on_close
				@copy_current_request_context
				def process_after_request():
					item.cache_url = new_base_url
					item.cache_expires = datetime.now() + timedelta(hours=1)
					db.session.add(item)
					db.session.commit()

				return response
			else:
				abort(404)
	else:
		abort(404)


# @bp.route("/members/admin/set_show_photos/oauth")
# @login_required
def oauth():
	"""admin"""
	if current_user.role != "admin":
		abort(403)
	if "localhost" in request.url_root:
		redirect_url = request.url_root + "members/admin/set_show_photos/form"
	else:
		redirect_url = str(request.url_root + "members/admin/set_show_photos/form").replace("http://", "https://")
	refresh_time = KeyValue.query.filter_by(key="refresh_time").first()

	if (refresh_time is not None) and (int(refresh_time.value) > int(time.time())):
		client_id = app.config['g_client_id']
		# client_secret = app.config['g_client_secret']

		auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
		scope = "https://www.googleapis.com/auth/photoslibrary"

		oauth2_url = f"{auth_endpoint}?" \
			f"scope={scope}&" \
			f"access_type=offline&" \
			f"include_granted_scopes=true&" \
			f"response_type=code&" \
			f"state={redirect_url}&" \
			f"redirect_uri={redirect_url}&" \
			f"client_id={client_id}"

		return redirect(oauth2_url)
	else:
		return redirect(redirect_url)


# @bp.route("/members/admin/set_show_photos/form", methods=["GET", "POST"])
# @login_required
def choose_album():
	"""admin"""
	if current_user.role != "admin":
		abort(403)

	client_id = app.config['g_client_id']
	client_secret = app.config['g_client_secret']

	if request.method == "GET":
		if request.args.get("code") is not None:
			url = "https://oauth2.googleapis.com/token"
			data = {
				"code": request.args.get("code"),
				"client_id": client_id,
				"client_secret": client_secret,
				"redirect_uri": request.args.get("state"),
				"grant_type": "authorization_code"
			}

			x = requests.post(url=url, data=data)
			access_token = x.json().get("access_token")
			refresh_token = x.json().get("refresh_token")
			if (db_refresh := KeyValue.query.filter_by(key="refresh_token").first()) is not None:
				db_refresh.value = refresh_token
				KeyValue.query.filter_by(key="refresh_time").first().value = int(time.time())
			else:
				# noinspection PyArgumentList
				new_token = KeyValue(
					key="refresh_token",
					value=refresh_token
				)
				# noinspection PyArgumentList
				new_time = KeyValue(
					key="refresh_time",
					value=int(time.time())
				)
				db.session.add(new_token)
				db.session.add(new_time)
			db.session.commit()

		else:
			refresh_token = KeyValue.query.filter_by(key="refresh_token").first().value
			url = "https://oauth2.googleapis.com/token"
			data = {
				"refresh_token": refresh_token,
				"client_id": client_id,
				"client_secret": client_secret,
				"grant_type": "refresh_token"
			}
			x = requests.post(url=url, data=data)
			access_token = x.json().get("access_token")

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

		# noinspection PyUnresolvedReferences
		shows = Show.query \
			.order_by(Show.date.asc()) \
			.with_entities(Show.id, Show.title, Show.date) \
			.all()

		return render_template(
			"set_show_photos.html",
			css="m_dashboard.css",
			albums=sorted(albums, key=lambda tup: tup[1]),
			shows=shows,
			refresh_token=refresh_token
		)

	else:
		refresh_token = request.form.get("refresh_token")
		url = "https://oauth2.googleapis.com/token"
		data = {
			"refresh_token": refresh_token,
			"client_id": client_id,
			"client_secret": client_secret,
			"grant_type": "refresh_token"
		}
		x = requests.post(url=url, data=data)
		access_token = x.json().get("access_token")

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

		return redirect(url_for("routes.past_show_redirect", show_id=request.form.get("show")))
