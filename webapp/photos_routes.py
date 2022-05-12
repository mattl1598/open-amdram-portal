import time
from pprint import pprint

import requests
from corha import corha
from flask import abort, jsonify, make_response, redirect, render_template, send_file, url_for, request, session
from flask_login import login_user, logout_user, current_user, login_required
from webapp import app, db
from webapp.models import KeyValue, Member, Show, ShowPhotos, User, MemberShowLink as MSL


@app.route("/photo/<id>")
@app.route("/video/<id>")
def get_photo(id):
	route = request.url_rule.rule[1:].split("/")[0]
	print(route)

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
		x = requests.post(url=url, data=data).json()
		session["access_token"] = x.get("access_token")
		session["access_token_expires"] = int(x.get("expires_in")) + int(time.time())
		session.modified = True

	dv = ""
	if route == "video":
		dv = "=dv"

	url = f"https://photoslibrary.googleapis.com/v1/mediaItems/{id}?access_token={session.get('access_token')}"
	x = requests.get(url=url).json()
	if route == "photo":
		return redirect(f"{x.get('baseUrl')}?w={x.get('mediaMetadata').get('width')}&h={x.get('mediaMetadata').get('height')}")
	elif route == "video":
		print(f"{x.get('baseUrl')}{dv}")
		return redirect(f"{x.get('baseUrl')}{dv}")
	else:
		abort(404)


@app.route("/members/set_show_photos/oauth")
def oauth():
	redirect_url = request.url_root + "members/set_show_photos/form"
	refresh_time = KeyValue.query.filter_by(key="refresh_time").first()
	print(int(refresh_time.value))
	print(int(time.time()))
	if (refresh_time is not None) and (int(refresh_time.value) > int(time.time())):
		return redirect(redirect_url)
	else:
		client_id = app.config['g_client_id']
		client_secret = app.config['g_client_secret']

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


@app.route("/members/set_show_photos/form", methods=["GET", "POST"])
def choose_album():
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
				new_token = KeyValue(
					key="refresh_token",
					value=refresh_token
				)
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
			pprint(data)
			x = requests.post(url=url, data=data)
			pprint(x.json())
			access_token = x.json().get("access_token")

		url = "https://photoslibrary.googleapis.com/v1/albums"
		y = requests.get(url + f"?access_token={access_token}&pageSize=50").json()

		albums = []
		next_token = "not none"
		while next_token is not None:
			for album in y.get("albums"):
				albums.append((album.get("id"), album.get("title"),))
			print(next_token := y.get("nextPageToken"))
			y = requests.get(url + f"?access_token={access_token}&pageSize=50&pageToken={next_token}").json()

		shows = Show.query \
			.with_entities(Show.id, Show.title)

		return render_template(
			"set_show_photos.html",
			css="m_dashboard.css",
			albums=albums,
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
		pprint(data)
		x = requests.post(url=url, data=data)
		pprint(x.json())
		access_token = x.json().get("access_token")

		data = {
			"albumId": request.form.get("album"),
			"pageSize": 100,
			"access_token": access_token
		}
		pprint(data)

		url = f"https://photoslibrary.googleapis.com/v1/mediaItems:search?access_token={access_token}"
		z = requests.post(url, data).json()
		# pprint(z)
		next_token = "not none"
		photos = []
		while next_token is not None:
			for photo in z.get("mediaItems"):
				print(photo.get("id"))
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

		return redirect(url_for("past_show_redirect", show_id=request.form.get("show")))
