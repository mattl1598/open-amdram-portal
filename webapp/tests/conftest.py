import pytest
import webapp

all_routes = [x.rule for x in webapp.create_app().url_map.iter_rules()]

auth_map = {}

option = ""


def pytest_addoption(parser):
	parser.addoption("--auth", dest="auth", action="store", default="public")


def pytest_configure(config):
	# global option
	# option = config.option
	# if option.auth == "public":
	# 	config.addinivalue_line(
	# 		"markers",
	# 		"public: mark test as testing the page from the public view",
	# 	)
	# elif option.auth in ["member", "author", "admin"]:
	# 	global auth
	# 	auth = option.auth
	# 	config.addinivalue_line(
	# 		"markers",
	# 		"members: mark test as testing the page from the members view"
	# 	)

	# config.addinivalue_line(
	# 	"markers",
	# 	"test: mark test as testing test functionality"
	# )

	config.addinivalue_line(
		"markers",
		"all_get: mark test as testing all routes"
	)


@pytest.fixture(scope="session")
def auth(request):
	return request.config.getoption("--auth")


@pytest.fixture(scope="session")
def app():
	app = webapp.create_app()
	app.config.update({
		"TESTING": True,
	})

	# other setup can go here
	for x in app.url_map.iter_rules():
		i = x.endpoint.split(".")
		auth_map[x.rule] = list(filter(None, (getattr(getattr(webapp, i[0]), i[1]).__doc__ or "").split(",")))

	yield app

	# clean up / reset resources here


@pytest.fixture(scope="session")
def test_client(app, auth):
	auth_level = auth
	client = app.test_client()
	if auth_level == "public":
		pass
	elif auth_level == "member":
		client.post("/members", data={
			"email": "test@example.com",
			"password": "test"
		})
	elif auth_level == "author":
		client.post("/members", data={
			"email": "testauthor@example.com",
			"password": "test"
		})
	elif auth_level == "admin":
		client.post("/members", data={
			"email": "testadmin@example.com",
			"password": "test"
		})
	yield client
	client.get("/members/logout")


@pytest.fixture(scope="session")
def client(app):
	return app.test_client()


@pytest.fixture(scope="session")
def member_client(app):
	new_client = app.test_client()
	new_client.post("/members", data={
		"email": "test@example.com",
		"password": "test"
	})
	yield new_client

	new_client.get("/members/logout")


@pytest.fixture(scope="session")
def author_client(app):
	new_client = app.test_client()
	new_client.post("/members", data={
		"email": "testauthor@example.com",
		"password": "test"
	})
	yield new_client

	new_client.get("/members/logout")


@pytest.fixture(scope="session")
def admin_client(app):
	new_client = app.test_client()
	new_client.post("/members", data={
		"email": "testadmin@example.com",
		"password": "test"
	})
	yield new_client

	new_client.get("/members/logout")


@pytest.fixture()
def runner(app):
	return app.test_cli_runner()
