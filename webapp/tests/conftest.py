import pytest
import webapp

all_routes = [x.rule for x in webapp.create_app().url_map.iter_rules()]

auth_map = {}

auth = ""


def pytest_addoption(parser):
	parser.addoption("--auth", action="store", default="")


def pytest_configure(config):
	global auth
	auth = config.getoption('auth')
	if auth == "public":
		config.addinivalue_line(
			"markers",
			"public: mark test as testing the page from the public view",
		)
	elif auth in ["member", "author", "admin"]:
		config.addinivalue_line(
			"markers",
			"members: mark test as testing the page from the members view"
		)

	# config.addinivalue_line(
	# 	"markers",
	# 	"test: mark test as testing test functionality"
	# )


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
