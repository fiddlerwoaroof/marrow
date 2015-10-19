import re
import urlparse

import lxml.html
import requests

from textblob import TextBlob
from textblob_aptagger import PerceptronTagger

def titlecase(line):
    blob = TextBlob(line, pos_tagger=PerceptronTagger())
    return unicode(blob.title())

class DefaultTitleGetter(object):
    url_cleaner = re.compile('[+\-_]')

    def get_title(self, url):
        s = requests.session()
        scheme, netloc, path, params, query, fragment = urlparse.urlparse(url, 'http')
        data = s.get(url)
        etree = lxml.html.fromstring(data.content.decode(data.encoding))

        canonicalLink = etree.xpath('//link[@rel="canonical"]/@href')
        if canonicalLink != []:
            canonicalLink = canonicalLink[0]
            data = s.get(canonicalLink)
            etree = lxml.html.fromstring(data.content.decode(data.encoding))
        else:
            canonicalLink = url

        title = etree.xpath('//title/text()')
        if title != []:
            title = title[0]
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
        return title, canonicalLink
