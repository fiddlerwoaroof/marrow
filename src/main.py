from flask import Flask
import os
import base64

from marrow import database
from marrow import user
from marrow import bone

app = Flask(__name__)
app.teardown_appcontext(database.close_connection)
app.config["APPLICATION_ROOT"] = "/api"

try:
    from marrow_config import secret_key
except ImportError:
    secret_key = base64.b64encode(os.urandom(24))

app.secret_key = secret_key

# Blueprints #
user.get_users(app)
app.register_blueprint(user.user_blueprint, url_prefix='/user')
app.register_blueprint(bone.bone_blueprint, url_prefix='/bones')

@app.route('/')
def index(): return 'Hello World'

if __name__ == '__main__':
    app.run(host='0.0.0.0')
