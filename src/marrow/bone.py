import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from flask.ext.cors import cross_origin
from . import database
import json

bone_blueprint = Blueprint('bone', __name__)

@bone_blueprint.route('/link/<linkid>', methods=['GET','DELETE'])
def delete_link(linkid):
    db = database.get_db()
    linkid = int(linkid)
    result = ''
    with db.cursor() as cur:
        if request.method == 'GET':
            cur.execute('SELECT id,url,title,posted FROM links WHERE id=%s', (linkid,))
            nid,url,title,posted = cur.fetchone()
            result = dict(id=nid,url=url,title=title,posted=posted.isoformat())
        elif request.method == 'DELETE':
            result = False
            if 'username' in session:
                cur.execute('SELECT delete_link(%s,%s)', (session['username'],linkid))
                result = cur.fetchone()[0]
    db.commit()
    return json.dumps(result)
    

@bone_blueprint.route('/add', methods=['POST'])
@bone_blueprint.route('/submit', methods=['POST'])
@cross_origin()
def submit_link():
    result = dict(success=False, id={});
    if 'username' in session:
        obj = request.get_json()
        url, title = obj['url'],obj['title']
        username = session['username']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('put_link', (username, url, title))
            ## This returns (link_id, user_id)
            res = cur.fetchone()
            if cur.rowcount != -1:
                db.commit()
                result['success'] = True
                result['id'] = res[0]
            else:
                db.rollback()
    return json.dumps(result)

@bone_blueprint.route('',defaults={'username':None}, methods=['GET'])
@bone_blueprint.route('/u/<username>', methods=['GET'])
def data(username):
    if username is None and 'username' in session:
        username = session['username']
    sectionTitle = username

    result = {'marrow':[], 'sectionTitle': sectionTitle}
    with database.get_db().cursor() as cur:
        cur.execute("SELECT url, title, posted, linkid from get_bone(%s);", (username,))
        result['marrow'] = [
                dict(id=linkid, url=url,title=title,posted=posted.isoformat())
                    for url,title,posted,linkid
                    in cur.fetchall()
        ]
    return json.dumps(result)

# TODO: rethink variable names here
@bone_blueprint.route('/unsubscribe', methods=['POST'])
def unsubscribe():
    data = request.get_json()
    result = False
    if 'username' in session:
        fro_user = session['username']
        to_user = data['from']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('unsubscribe', (fro_user,to_user))
            db.commit()
            result = True
    return json.dumps(result)

@bone_blueprint.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    result = False
    if 'username' in session:
        fro_user = session['username']
        to_user = data['to']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('subscribe', (fro_user,to_user))
            db.commit()
            result = True
    return json.dumps(result);

@bone_blueprint.route('/subscriptions')
def subscriptions():
    username = None
    result = {'marrow':[], 'sectionTitle': 'Subscriptions'}
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
