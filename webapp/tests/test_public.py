import pytest
import pprint

from webapp.tests.conftest import all_routes


@pytest.mark.public
@pytest.mark.parametrize("route", all_routes)
def test_public_views(route, client):
	if "upload" in route:
		codes = [405]
	elif route[:len("/members/")] == "/members/":
		codes = [401]
		if route == "/members/otp":
			codes = [302]
	elif "<" in route:
		codes = [404]
	else:
		codes = [200, 302]
	response = client.get(route, headers={"Referer": '/'})
	# if response.status_code == 302:
	# 	print(response.data)
	assert response.status_code in codes
