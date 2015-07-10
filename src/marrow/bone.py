import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from flask.ext.cors import cross_origin
from flask.ext.login import login_required, current_user
import urllib2
import lxml.html
from . import database
import urlparse
import json
from marrow_config import config
import dateutil.parser

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
@login_required
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
                cur.execute('SELECT delete_link(%s,%s)', (current_user.id,linkid))
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

def vote_link_common(vote):
    obj = request.get_json()
    url = obj['url']
    db = database.get_db()
    result = dict(success=False, votes=None, myvote=None)
    with db.cursor() as cur:
        url = url.encode('utf-8')
        cur.callproc('vote_link', (url, current_user.id, vote))
        dbresult = cur.fetchone()
    print(dbresult, "<--- dbresult")
    if dbresult is not None:
        myvote, total = dbresult
        result['success'] = True
        result['myVote'] = myvote
        result['votes'] = total
        db.commit()
    else:
        db.rollback();
    print 'done!'
    print result, '<-- result'
    return (json.dumps(result), 200, {'Content-Type': 'application/json'})


@bone_blueprint.route('/vote/zero', methods=['POST'])
@login_required
def vote_link_zero():
    return vote_link_common(0)
    
@bone_blueprint.route('/vote/down', methods=['POST'])
@login_required
def vote_link_down():
    return vote_link_common(-1)

@bone_blueprint.route('/vote/up', methods=['POST'])
@login_required
def vote_link_up():
    return vote_link_common(1)

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
        username = session['username'] # Note that we need to figger out a better way to do the extension
                                       # auth before we can change this to Flask-Login

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
    return json.dumps(result), 200, {'Content-Type':'application/json'}

@bone_blueprint.route('',defaults={'username':None}, methods=['GET'])
@bone_blueprint.route('/u/<username>', methods=['GET'])
@login_required
def data(username):
    if username is None and 'username' in session:
        username = current_user.id
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
@login_required
def unsubscribe():
    data = request.get_json()
    result = False
    if 'username' in session:
        fro_user = current_user.id
        to_user = data['from']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('unsubscribe', (fro_user,to_user))
            db.commit()
            result = True
    return json.dumps(result)

@bone_blueprint.route('/subscribe', methods=['POST'])
@login_required
def subscribe():
    data = request.get_json()
    result = False
    if 'username' in session:
        fro_user = current_user.id
        to_user = data['to']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('subscribe', (fro_user,to_user))
            db.commit()
            result = True
    return json.dumps(result);

@bone_blueprint.route('/subscriptions', defaults={'before':None, 'count': None})
@bone_blueprint.route('/subscriptions/<before>', defaults={'count': None})
@bone_blueprint.route('/subscriptions/count/<int:count>', defaults={'before': None})
@cross_origin(allow_headers='Content-Type')
def subscriptions(before, count):
    result = {'marrow':[], 'sectionTitle': 'Subscriptions'}
    username = None
    db = database.get_db()
    with db: # Start transaction to make sure that the ak really is deleted.
             # Otherwise, a malicious attacker could sniff the ak and reuse
             # it.
        if 'username' in request.args:
            username = request.args['username']
            if 'ak' not in request.args: username = None
            elif not database.check_ak(db, username, request.args['ak']): username = None
    if username is None and 'username' in session:
        username = current_user.id

    if username is not None:
        with db.cursor() as cur:
            if count is None or count > 200: count = 50  # 50 results or up to 200 results
            args = (username,count)
            if before is not None:
                before = dateutil.parser.parse(before)
                args = args + (before,)
            cur.callproc("get_bones", args)
            result['marrow'] = [
                dict(poster=poster, url=url,title=title,posted=posted.isoformat(), votes=votes, myVote=myvote)
                    for url,title,posted,poster,votes,myvote
                    in cur.fetchall()
            ]
    return (json.dumps(result), 200, {'Content-Type': 'application/json'})

import random
@bone_blueprint.route('/random')
@login_required
def random():
    db = database.get_db()
    with db.cursor() as cur:
        if 'username' in session:
            exclude = [current_user.id]
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
