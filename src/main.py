from flask import Flask, g, request
from flask_limiter import Limiter
import os
import base64

from marrow import database
from marrow import user
from marrow import bone

app = Flask(__name__)
app.teardown_appcontext(database.close_connection)
app.config["APPLICATION_ROOT"] = "/api"

try:
    from marrow_config import config
except ImportError:
    class config:
        secret_key = base64.b64encode(os.urandom(24))
        debug = False

app.secret_key = config.secret_key
app.debug = config.debug

limiter = Limiter(app)
limiter.limit("60/hour 3/second", key_func=lambda: request.host)(user.user_blueprint)
limiter.exempt(user.checkuser)

# Blueprints #
user.get_users(app)
app.register_blueprint(user.user_blueprint, url_prefix='/user')
app.register_blueprint(bone.bone_blueprint, url_prefix='/bones')

@app.route('/')
def index(): return 'Hello World'

if __name__ == '__main__':
    app.run(host='0.0.0.0')
