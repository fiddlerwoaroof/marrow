import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from flask.ext.cors import cross_origin
import urllib2
import lxml.html
from . import database
import urlparse
import json
from marrow_config import config

bone_blueprint = Blueprint('bone', __name__)

useragent = [
  ('User-agent',
   'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36')]

for handler in [urllib2.HTTPSHandler,urllib2.HTTPHandler]:
    handler = handler()
    opener = urllib2.build_opener(handler)
    opener.addheaders = useragent
    urllib2.install_opener(opener)

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
    
def clean_url(url):
    scheme, netloc, path, params, query, fragment = urlparse.urlparse(url, 'http')
    if path and not netloc:
        netloc, path = path, netloc
    return urlparse.urlunparse((scheme, netloc, path, params, query, fragment))

def get_title(url):
    return config.titlegetter.get_title(url)

@bone_blueprint.route('/add', methods=['POST'])
@bone_blueprint.route('/submit', methods=['POST'])
@cross_origin(allow_headers='Content-Type')
def submit_link():
    result = dict(success=False, id={});
    username = None
    db = database.get_db()
    obj = request.get_json()
    if 'username' in obj:
        _username = obj['username']
        _username = _username.lower().strip()
        if 'ak' in obj and database.check_ak(db, _username, obj['ak']): 
            username = _username
        else:
            abort(401);
            return
    elif 'username' in session:
        username = session['username']

    if username is not None:
        url, title = obj['url'],obj['title']
        url = clean_url(url)
        title = get_title(url)
        with db.cursor() as cur:
            cur.callproc('put_link', (username, url, title))
            ## This returns (link_id, user_id)
            res = cur.fetchone()
            if cur.rowcount > 0:
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
            cur.execute("SELECT poster, url, title, posted from get_bones(%s);", (username,))
            result['marrow'] = [
                    dict(poster=poster, url=url,title=title,posted=posted.isoformat())
                        for poster,url,title,posted
                        in cur.fetchall()
            ]
    return json.dumps(result)

import random
@bone_blueprint.route('/random')
def random():
    db = database.get_db()
    with db.cursor() as cur:
        if 'username' in session:
            exclude = [session['username']]
            if 'last' in request.args:
                exclude.append(request.args['last'])
            cur.execute(
                'SELECT name FROM users WHERE name NOT IN  %s ORDER BY random() LIMIT 1',
                (tuple(exclude),)
            )
        else:
            cur.execute('SELECT name FROM users ORDER BY random() LIMIT 1')
        username = cur.fetchone()[0]
        return redirect(url_for('bone.data', username=username))
