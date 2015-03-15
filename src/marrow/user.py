import flask
from flask import Blueprint, session, redirect, url_for, escape, request, abort, g
from . import database
import json

user_blueprint = Blueprint('user', __name__)

users = {}
def get_users(app):
    with app.app_context(): _get_users()

def _get_users():
    global users
    cur = database.get_db().cursor()
    with cur:
        cur.execute('SELECT name,password,email FROM users')
        for username,password,email in cur.fetchall():
            users[username] = dict(username=username, password=password, email=email)
    
#TODO: load this from somewhere
user_env = {}
@user_blueprint.route('/environment')
def get_user_env():
    if 'username' in session:
        username = session['username']
        env = user_env.setdefault(username, {})
        env['username'] = username
        return env
        
@user_blueprint.route('/subscribe/<username>', methods=['POST'])
def subscribe(username):
    if 'username' in session:
        db = database.get_db()
        with db.cursor() as cur:
            cur.callproc('subscribe', (session['username'], username))
        db.commit()
        return json.dumps(True)

@user_blueprint.route('/list')
def list_users():
    return json.dumps([_ for _ in users.keys()])

@user_blueprint.route('/add', methods=['POST'])
def adduser():
    db = database.get_db()
    with db.cursor() as cur:
        obj = request.get_json();
        username, password = obj['username'], obj['password']
        cur.execute('INSERT INTO users (name,password,email) VALUES (%s,%s,%s)',
                    (username, password, 'abc@def.com'))
        _get_users()
        db.commit()
        session['username'] = username
        return json.dumps(True)

@user_blueprint.route('/check')
def checkuser():
    return json.dumps('username' in session)

@user_blueprint.route('/login', methods=['POST'])
def login():
    obj = request.get_json();
    result = False
    username, password = obj['username'], obj['password']
    user = users.get(username, {})
    rightPassword = user.get('password',None)
    if password == rightPassword:
        session['username'] = username
        result = True
    return json.dumps(result)

@user_blueprint.route('/logout')
def logout():
    to = request.args.get('to', '/')
    session.pop('username', None)
    return redirect(to)

