from flask import g
import psycopg2

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = psycopg2.connect(
          database="marrow",
          user="marrow",
          password="marrowpass",
          host="pgsqlserver.elangley.org"
        );
    return db

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


