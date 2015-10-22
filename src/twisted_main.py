from twisted.python import log
import random
import sys
import psycopg2
from twisted.internet.defer import Deferred, inlineCallbacks, returnValue
from twisted.internet import reactor
import json
import cyclone.web
from marrow_config import config

class Event(object):
    def __init__(self, id, event, data):
        self.id = id
        self.event = event
        self.data = data
    def __str__(self):
        return '''id: %s\nevent: %s\ndata: %s\n\n''' % (self.id, self.event, json.dumps(self.data))
    def write_to(self, request):
        request.write(str(self))
        request.flush()

class EventStream(object):
    def __init__(self):
        self.id = 0
        self.readers = {}
    def add_reader(self, reader):
        self.readers[id(reader)] = reader
    def remove_reader(self, reader):
        idreader = id(reader)
        if idreader in self.readers:
            del self.reader[idreader]
    def submit_event(self, event, data):
        self.id += 1
        evt = Event(self.id, event, data)
        for reader in self.readers.values():
            evt.write_to(reader)

es = EventStream()
class EventHandler(cyclone.web.RequestHandler):
    @cyclone.web.asynchronous
    def get(self):
        self.set_header('Content-Type', 'text/event-stream')
        self.set_header('X-Accel-Buffer', 'off')
        es.add_reader(self)
    def on_connection_close(self):
        es.remove_reader(self)


class MainHandler(cyclone.web.RequestHandler):
    def get(self):
        self.write('''<html><head><script src="//code.jquery.com/jquery-2.1.4.min.js"></script>
                <script>a = new EventSource('/events');
                        a.addEventListener('test', function(dat) { console.log(JSON.parse(dat.data)) })
                </script></head></html>''')
        self.finish()


@inlineCallbacks
def eventick(step):
    while True:
        print 'tick--> '
        es.submit_event(*step())
        d = Deferred()
        reactor.callLater(random.random()*5 + 2.5, d.callback, None)
        yield d
        print '        -->tock'

def get_db():
    return psycopg2.connect(
        database=config.db,
        user=config.user,
        password=config.password,
        host=config.host
    )

db = get_db()
def check_users():
    with db.cursor() as cur:
        cur.execute("SELECT * FROM recently_active_users ORDER BY posted DESC LIMIT 10")
        store = []
        for id,name,last_posted in cur.fetchall():
            store.append(dict(
                id=id,
                name=name,
                last_posted=last_posted.isoformat()))
        return 'active_users', store

application = cyclone.web.Application([
    (r"/", MainHandler),
    (r"/events", EventHandler),
])

log.startLogging(sys.stdout)
reactor.listenTCP(8080, application)
reactor.callWhenRunning(eventick, check_users)
reactor.run()
