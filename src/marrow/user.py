from __future__ import division
import json

import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from flask.ext.cors import cross_origin
from flask.ext.login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import psycopg2

login_manager = LoginManager()
# login_manager.login_view = "/login.html"
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
        print 'users!,', users
    except:
        if cleanup: db.rollback()
        raise
    else:
        if cleanup: db.commit()

class User(UserMixin):
    users = {}
    @classmethod
    def get_user(cls, name):
        print 'get_user!', name
        if name not in cls.users and name in users:
            user = users[name]
            cls.users[name] = cls(user['username'], None, user['email'])
        return cls.users.get(name)

    def __init__(self, id, passwordhash, email):
        self.id = id
        self.passwordhash = passwordhash
        self.email = email
        self.users[id] = self
login_manager.user_loader(User.get_user)


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
                login_user(User.get_user(username))
            except psycopg2.IntegrityError as e:
                db.rollback()
                if e.pgcode == '23505': #username not unique
                    result['message'] = 'Username in use'
                elif e.pgcode == '23502': #username empty
                    result['message'] = 'Username required'
                else: raise
            else: db.commit()
    return json.dumps(result)

@user_blueprint.route('/active')
def active():
    result = dict(status=False, data=[])
    with database.get_db() as db:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM recently_active_users ORDER BY posted DESC LIMIT 10")
            store = result['data']
            for id,name,last_posted in cur.fetchall():
                store.append(
                    dict(
                        id=id,
                        name=name,
                        last_posted=last_posted.isoformat()
                    )
                )
    return (json.dumps(result), 200, {'Content-Type': 'application/json'})

@user_blueprint.route('/following')
@login_required
def following():
    result = dict(status=False, data=[])
    if 'username' in session:
        username = session['username']
        with database.get_db() as db:
            with db.cursor() as cur:
                print 'current_user:', current_user.id
                cur.callproc('get_subscriptions', (current_user.id,))
                result['data'] = [x[0] for x in cur.fetchall()]

    return json.dumps(result)

@user_blueprint.route('/check')
def checkuser(): return json.dumps({'result': 'username' in session})

import os, base64
def gen_ak(db):
    return ak

@user_blueprint.route('/env/<user>', methods=['POST'])
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
                    user = User.get_user(username)
                    login_user(user)
                    session['username'] = username
                    result['status'] = True
            else:
                result['message'] = 'Wrong Username or Password'
    return json.dumps(result)

import functools
def wrap_result(result_key):
    func = []
    def _inner(*a, **kw):
        result = {'success': False, result_key: func[-1](*a, **kw)}
        result['success'] = result[result_key] is not None
        return json.dumps(result), 200, {'Content-Type': 'application/json'}
    def _outer(f):
        func.append(f)
        return functools.wraps(f)(_inner)
    return _outer

# f\left(x\right)\ =\frac{\left(x+1\right)^{\left(1-n\right)}-1}{1-n}\cdot \frac{m\left(1-n\right)}{\left(m+1\right)^{\left(1-n\right)}-1}


# This is a magic function to make reputation fall away from
# a linear increase with the number of votes: the values n and 
# m are key and are derived from eyeballing an experiment.
# the adj_factor makes the value of bias at x=m == x
n = 0.4
m = 50
exponent = 1-n
adj_factor = 1
def bias(x):
    result = (x+1)**exponent - 1
    result /= exponent
    result *= adj_factor
    return result
adj_factor = m / bias(m)

 
@user_blueprint.route('/reputation', methods=['POST'],defaults={'username':None})
@user_blueprint.route('/reputation/<username>')
@login_required
@wrap_result('reputation')
def reputation(username):
    result = None
    with database.get_db() as db:
        with db.cursor() as cur:
            if username is None:
                obj = request.get_json(force=True)
                obj = set(obj)
                result = {}
                for n in obj:
                    cur.callproc('total_user_votes', (n,))
                    dbresult, = cur.fetchone()
                    result[n] = int(round(bias(dbresult)))
                if result == {}: result = None
            else:
                cur.callproc('total_user_votes', (username,))
                dbresult, = cur.fetchone()
                result =  int(round(bias(dbresult)))
    return result

@user_blueprint.route('/logout')
def logout():
    to = request.args.get('to', '/')
    session.pop('username', None)
    logout_user()
    return redirect(to)

