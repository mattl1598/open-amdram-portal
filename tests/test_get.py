import pytest
from tests.conftest import all_routes, auth_map


@pytest.mark.all_get
@pytest.mark.parametrize("route", all_routes)
def test_all_get(route, test_client, auth):
	with test_client:
		response = test_client.get(route, headers={"Referer": '/'})
		resp_code = response.status_code

	if "upload" in route or "subs_payment" in route:
		codes = [405]
	elif route == "/members/otp":
		codes = [302]
	elif len(auth_map[route]) > 0 and auth not in auth_map[route]:
		if auth == "public":
			codes = [401]
		else:
			codes = [403]
	elif "<" in route or "csv" in route:
		codes = [404]
	else:
		codes = [200, 302]

	assert resp_code in codes
