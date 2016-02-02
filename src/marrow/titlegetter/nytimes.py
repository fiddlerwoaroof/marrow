import urlparse
import urllib2
import json

# TODO: this should use the articlesearch API, if this is actually necessary
class TimesTitleGetter(object):
    api_url='http://api.nytimes.com/svc/news/v3/content.json?url=%(url)s&api-key=%(api_key)s'
    site='nytimes.com'
    def __init__(self, api_key):
        self.api_key = api_key
    def get_title(self, url):
        url = urllib2.quote(url, '')
        api_url = self.api_url % dict(url=url, api_key=self.api_key)
        info = json.load(urllib2.urlopen(api_url))
        title = info['results'][0]['title']
        source = info['results'][0]['source']
        return u'%s \u2014 %s' % (title, source), url
