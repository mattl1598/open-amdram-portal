import pytest
from webapp.tests.conftest import all_routes, auth_map


@pytest.mark.members
@pytest.mark.parametrize("route", all_routes)
@pytest.mark.parametrize("auth", [
	"member",
	"author",
	"admin"
])
def test_members_views(route, auth, admin_client, author_client, member_client):
	client_dict = {"member": member_client, "author": author_client, "admin": admin_client}
	auth_client = client_dict[auth]
	if "logout" not in route:
		with auth_client:
			response = auth_client.get(route, headers={"Referer": '/'})
			resp_code = response.status_code
	else:
		resp_code = 200

	if "upload" in route:
		codes = [405]
	elif route == "/members/otp":
		codes = [302]
	elif len(auth_map[route]) > 0 and auth not in auth_map[route]:
		codes = [403]
	elif "<" in route or "csv" in route:
		codes = [404]
	else:
		codes = [200, 302]

	assert resp_code in codes
