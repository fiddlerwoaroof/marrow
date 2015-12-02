from flask import g
import psycopg2

try: from marrow_config import config
except ImportError:
    class config:
        class db:
            db = "marrow"
            user = "marrow"
            password = "marrowpass"
            host = "pgsqlserver.elangley.org"

def get_db(close=True):
    db = getattr(g, '_database', None)
    _config = config.db
    if db is None:
        db = g._database = [psycopg2.connect(
          database=_config.db,
          user=_config.user,
          password=_config.password,
          host=_config.host
        ),close];
    return db[0]

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None and db[1]:
        db[0].close()

def check_ak(db, username, ak):
    with db.cursor() as cur:
        cur.callproc('check_ak', (username, ak))
        return cur.rowcount > 0
