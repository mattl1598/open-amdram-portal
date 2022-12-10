import pytest
import pprint

from flask_login import login_user
from flask import session

from webapp import load_user, User
from webapp.tests.conftest import all_routes, auth_map


@pytest.mark.members
@pytest.mark.parametrize("route", all_routes)
@pytest.mark.parametrize("login", [
	["member", "test@example.com"],
	["author", "testauthor@example.com"],
	["admin", "testadmin@example.com"]
])
def test_members_views(route, login, client):
	with client:
		client.post("/members", data={
				"email": login[1],
				"password": "test"
			})
		auth = login[0]
		response = client.get(route, headers={"Referer": '/'})
		client.get("/members/logout")

	if "upload" in route:
		codes = [405]
	elif route == "/members/otp":
		codes = [302]
	elif len(auth_map[route]) > 0 and auth not in auth_map[route]:
		# print(auth, auth_map[route], sep=" in ")
		codes = [403]
	elif "<" in route or "csv" in route:
		codes = [404]
	else:
		codes = [200, 302]

	# if response.status_code == 302:
	# 	print(response.data)
	assert response.status_code in codes
