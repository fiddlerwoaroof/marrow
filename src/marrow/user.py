import json

import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from flask.ext.cors import cross_origin
import psycopg2

from . import database

user_blueprint = Blueprint('user', __name__)

users = {}
def get_users(app):
    with app.app_context(): _get_users()

def _get_users(db=None):
    global users
    cleanup = False
    if db is None:
        db = database.get_db()
        cleanup = True
    try:
        cur = db.cursor()
        with cur:
            cur.execute('SELECT name,password,email FROM users')
            for username,password,email in cur.fetchall():
                users[username] = dict(username=username, password=password, email=email)
    except:
        if cleanup: db.rollback()
        raise
    else:
        if cleanup: db.commit()

#TODO: load this from somewhere
user_env = {}
@user_blueprint.route('/environment')
def get_user_env():
    if 'username' in session:
        username = session['username']
        env = user_env.setdefault(username, {})
        env['username'] = username
        return env

@user_blueprint.route('/follows/<to>')
def follows(to):
    result = {'follows': False, 'me': ''}
    if 'username' in session:
        fro = session['username']
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('follows', (fro,to))
            result['follows'] = cur.fetchone()[0]
            result['me'] = session['username']
        db.commit()
    return json.dumps(result)

#@user_blueprint.route('/subscribe/<username>', methods=['POST'])
#def subscribe(username):
#    if 'username' in session:
#        db = database.get_db()
#        with db.cursor() as cur:
#            cur.callproc('subscribe', (session['username'], username))
#        db.commit()
#        return json.dumps(True)

# NOTE: disabled to to privacy/security concerns
# @user_blueprint.route('/list')
# def list_users():
#     return json.dumps([_ for _ in users.keys()])

@user_blueprint.route('/add', methods=['POST'])
def adduser():
    db = database.get_db()
    result = {'status': False, 'message': ''}
    with db.cursor() as cur:
        obj = request.get_json();
        try:
            username, password = obj['username'], obj['password']
        except KeyError:
            print obj
            result['message'] = 'Username required' if 'username' not in obj else 'Password required'
        else:
            username = username.strip().lower()
            password = password.strip()
            try:
                cur.execute("INSERT INTO users (name,password,email) VALUES (%s,crypt(%s, gen_salt('bf', 11)),%s)",
                            (username, password, 'abc@def.com'))
                session['username'] = username
                result['status'] = True
                _get_users()
            except psycopg2.IntegrityError as e:
                db.rollback()
                if e.pgcode == '23505': #username not unique
                    result['message'] = 'Username in use'
                elif e.pgcode == '23502': #username empty
                    result['message'] = 'Username required'
                else: raise
            else: db.commit()
    return json.dumps(result)

@user_blueprint.route('/following')
def following():
    result = dict(status=False, data=[])
    if 'username' in session:
        username = session['username']
        with database.get_db() as db:
            with db.cursor() as cur:
                cur.callproc('get_subscriptions', (username,))
                result['data'] = [x[0] for x in cur.fetchall()]

    return json.dumps(result)

@user_blueprint.route('/check')
def checkuser(): return json.dumps({'result': 'username' in session})

import os, base64
def gen_ak(db):
    return ak

@user_blueprint.route('/<user>/env', methods=['POST'])
def getenv(user): pass

@user_blueprint.route('/change-password', methods=['POST'])
def changepass():
    obj = request.get_json();
    result = dict(status=False, message='')
    if 'username' in session:
        username, old_password, new_password = session['username'], obj['old_password'], obj['new_password']
        user = users[username]
        if old_password == user['password']:
            with database.get_db() as db:
                with db.cursor() as cur:
                    cur.execute('UPDATE users SET password=%s WHERE name=%s', (new_password, username))
                    _get_users(db)
                    result['status'] = True
        else:
            result['message'] = 'Wrong Username or Password'
    else:
        result['message'] = 'Wrong Username or Password'
    return json.dumps(result)

@user_blueprint.route('/login', methods=['POST'])
@cross_origin(allow_headers='Content-Type')
def login():
    obj = request.get_json();
    result = {'status': False, 'message': ''}
    username, password = obj['username'], obj['password']
    username = username.strip().lower()
    password = password.strip()
    user = users.get(username, {})
    rightPassword = user.get('password',object())
    with database.get_db() as db:
        with db.cursor() as cur:
            cur.callproc('check_password', (username, password))
            success = cur.fetchone()[0]
            if success:
                if 'ak' in request.args and request.args['ak']:
                    ak = base64.b64encode(os.urandom(24))
                    with database.get_db() as db:
                        with db.cursor() as cur:
                            cur.callproc('put_ak', (username, ak))
                    result = {'success': True, 'ak': ak}
                else:
                    session['username'] = username
                    result['status'] = True
            else:
                result['message'] = 'Wrong Username or Password'
    return json.dumps(result)

@user_blueprint.route('/logout')
def logout():
    to = request.args.get('to', '/')
    session.pop('username', None)
    return redirect(to)

