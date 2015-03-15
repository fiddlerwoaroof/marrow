from flask import Flask, session, redirect, url_for, escape, request, abort, g
import json
import os
import base64
import psycopg2

from marrow import database
from marrow import user
from marrow import bone

app = Flask(__name__)
app.teardown_appcontext(database.close_connection)
app.config["APPLICATION_ROOT"] = "/api"
app.secret_key = base64.b64encode(os.urandom(24))
app.debug = True


# Blueprints #
user.get_users(app)
app.register_blueprint(user.user_blueprint, url_prefix='/user')
app.register_blueprint(bone.bone_blueprint, url_prefix='/bones')


links = {}
def get_feeds(filename):
    global links
    with open(filename) as f:
        links = json.load(f)

@app.route('/')
def index():
    return 'Hello World'

if __name__ == '__main__':
    app.run(host='0.0.0.0')
