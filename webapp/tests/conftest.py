import pytest
# from webapp import create_app
import webapp
from pprint import pprint

all_routes = [x.rule for x in webapp.create_app().url_map.iter_rules()]

auth_map = {}


def pytest_configure(config):
	config.addinivalue_line(
		"markers",
		"public: mark test as testing the page from the public view",
	)
	config.addinivalue_line(
		"markers",
		"members: mark test as testing the page from the members view"
	)
	config.addinivalue_line(
		"markers",
		"test: mark test as testing test functionality"
	)


@pytest.fixture(scope="session")
def app():
	app = webapp.create_app()
	app.config.update({
		"TESTING": True,
	})

	# other setup can go here
	for x in app.url_map.iter_rules():
		# print(x.rule, x.endpoint, sep=" -> ")
		i = x.endpoint.split(".")
		auth_map[x.rule] = list(filter(None, (getattr(getattr(webapp, i[0]), i[1]).__doc__ or "").split(",")))
		# print(auth_map[x.rule])

	yield app

	# clean up / reset resources here


@pytest.fixture(scope="session")
def client(app):
	return app.test_client()


@pytest.fixture()
def runner(app):
	return app.test_cli_runner()


