from flask import Flask, session, redirect, url_for, escape, request, abort
import json

app = Flask(__name__)
app.config["APPLICATION_ROOT"] = "/api"

links = {}
def get_feeds(filename):
    global links
    with open(filename) as f:
        links = {'everyone': json.load(f)}

@app.route('/')
def index():
    return 'Hello World'

@app.route('/humans.txt')
def humans():
    return 'blah'

@app.route('/data/submit', methods=['POST'])
def submit_link():
    result = False
    if 'username' in session:
        obj = request.get_json()
        links.setdefault(session['username'], []).append(dict(
            title = obj.get('title',''), #TODO: get title somehow . . .
            url = obj['url']
        ))
        result = True
    return json.dumps(result)

@app.route('/data/<username>')
def user_data(username):
    return json.dumps(links.get(username, []))

@app.route('/data',methods=['GET'])
def data():
    result = {'marrow':[]}
    if 'username' in session:
        result['marrow'] = links.get(session['username'])
    else:
        result['marrow'] = links['everyone']
    return json.dumps(result)

users = {}
def get_users(filename):
    global users
    with open(filename) as f:
        users = {x['username']:x for x in json.load(f)}


@app.route('/user/add', methods=['GET', 'POST'])
def adduser():
    if request.method == 'POST':
        users[request.form['username']] = dict(username=request.form['username'],
                                               password=request.form['password'])
        return redirect(url_for('index'))
    else:
        return '''<form action="" method="post"><p>
                    <input type=text name=username>
                    <input type=text name=password>
                    <p><input type=submit value='Add User'></form>'''

@app.route('/user/check')
def checkuser():
    return json.dumps('username' in session)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username, password = request.form['username'], request.form['password']
        user = users.get(username, {})
        rightPassword = user.get(password,None)
        if password == rightPassword:
            session['username'] = request.form['username']
        else:
            abort(403)
        to = request.args.get('to', '/')
        return redirect(to)
    else:
        return '''<form action="" method="post"><p>
                    <label for=username>User:</label>
                    <input type=text name=username>
                    <label for=password>Passwod:</label>
                    <input type=text name=password>
                    <p><input type=submit value=Login></form>'''

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))


app.secret_key = 'Rp7ZKSO21AUDz6DUdROxVoWlZdUoGciX'

get_users('sample_data/users.json')
get_feeds('sample_data/sites.json')
app.debug = True
if __name__ == '__main__':
    app.run(host='0.0.0.0')
