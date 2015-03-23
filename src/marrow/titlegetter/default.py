import lxml.html
import urllib2
import urlparse
import re

from textblob import TextBlob
from textblob_aptagger import PerceptronTagger

def titlecase(line):
    blob = TextBlob(line, pos_tagger=PerceptronTagger())
    return unicode(blob.title())

class DefaultTitleGetter(object):
    url_cleaner = re.compile('[+\-_]')

    def get_title(self, url):
        scheme, netloc, path, params, query, fragment = urlparse.urlparse(url, 'http')
        data = urllib2.urlopen(url)
        etree = lxml.html.parse(data)
        titleElems = etree.xpath('//title')
        title = url
        if titleElems != []:
            title = titleElems[0].text
        elif path:
            # hacky way to make a title
            path = urlparse.unquote(path)
            path = self.url_cleaner.sub(u' ', path)
            path = path.split()
            path = u' '.join(path)
            path = path.replace('//','/').split(u'/')
            title = map(titlecase, path)
            title = u' \u2014 '.join(title)
            title = u' \u2014 '.join([title, netloc])
        return title
