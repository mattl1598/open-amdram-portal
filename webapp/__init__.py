from flask import Flask
import os
from sass import compile

app = Flask(__name__)

compile(dirname=("webapp/static/scss/", "webapp/static/css/"), output_style="compressed")

from webapp import routes
