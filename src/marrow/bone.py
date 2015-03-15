import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from . import database
import json

bone_blueprint = Blueprint('bone', __name__)

@bone_blueprint.route('/submit', methods=['POST'])
def submit_link():
    result = False
    if 'username' in session:
        obj = request.get_json()
        url, title = obj['url'],obj['title']
        username = session['username']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('put_link', (username, url, title))
            cur.fetchall()
            if cur.rowcount != -1:
                db.commit()
                result = True
    return json.dumps(result)

@bone_blueprint.route('',defaults={'username':None}, methods=['GET'])
@bone_blueprint.route('/u/<username>', methods=['GET'])
def data(username):
    if username is None and 'username' in session:
        username = session['username']

    result = {'marrow':[]}
    with database.get_db().cursor() as cur:
        cur.execute("SELECT url, title, posted from get_bone(%s);", (username,))
        result['marrow'] = [
                dict(url=url,title=title,posted=posted.isoformat())
                    for url,title,posted
                    in cur.fetchall()
        ]
    return json.dumps(result)

@bone_blueprint.route('/subscriptions')
def subscriptions():
    username = None
    result = {'marrow':[]}
    if 'username' in session:
        username = session['username']
        with database.get_db().cursor() as cur:
            cur.execute("SELECT url, title, posted from get_bones(%s);", (username,))
            result['marrow'] = [
                    dict(url=url,title=title,posted=posted.isoformat())
                        for url,title,posted
                        in cur.fetchall()
            ]
    return json.dumps(result)

def data(username):
    if username is None and 'username' in session:
        username = session['username']

    result = {'marrow':[]}
    with database.get_db().cursor() as cur:
        cur.execute("SELECT url, title, posted from get_bone(%s);", (username,))
        result['marrow'] = [
                dict(url=url,title=title,posted=posted.isoformat())
                    for url,title,posted
                    in cur.fetchall()
        ]
    return json.dumps(result)

import random
@bone_blueprint.route('/random')
def random():
    db = database.get_db()
    with db.cursor() as cur:
        if 'username' in session:
            cur.execute('SELECT name FROM users WHERE name != %s ORDER BY random() LIMIT 1',
                    (session['username'],))
        else:
            cur.execute('SELECT name FROM users ORDER BY random() LIMIT 1')
        username = cur.fetchone()[0]
        return redirect(url_for('bone.data', username=username))
