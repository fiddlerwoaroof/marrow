from flask import g
import psycopg2
try: from marrow_config import config
except ImportError:
    class config:
        db = "marrow"
        user = "marrow"
        password = "marrowpass"
        host = "pgsqlserver.elangley.org"

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = psycopg2.connect(
          database=config.db,
          user=config.user,
          password=config.password,
          host=config.host
        );
    return db

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def check_ak(db, username, ak):
    with db.cursor() as cur:
        cur.callproc('check_ak', (username, ak))
        return cur.rowcount > 0
