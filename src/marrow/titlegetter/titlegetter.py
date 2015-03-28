import urllib2
import urlparse

from .utils import memoize
from .default import DefaultTitleGetter

def clean_url(url):
    scheme, netloc, path, params, query, fragment = urlparse.urlparse(url, 'http')
    if path and not netloc:
        netloc, path = path, netloc
    return urlparse.urlunparse((scheme, netloc, path, params, query, fragment)), netloc

def split_netloc(netloc):
    tail = netloc
    while tail != u'':
        yield tail
        head, div, tail = tail.partition(u'.')

class TitleGetter(object):
    getters = {}
    @classmethod
    def add_getter(cls, getter):
        cls.getters[getter.site] = getter

    default_handler = DefaultTitleGetter()

    title_cache = {}
    @memoize(title_cache)
    def get_title(self, url):
        url, site = clean_url(url)
        handler = self.default_handler
        for site in split_netloc(urlparse.urlparse(url).netloc):
            if site in self.getters:
                handler = self.getters[site]
                break

        title = None
        try:
            title = handler.get_title(url)
        except urllib2.HTTPError:
            title = self.default_handler.get_title(url)

        return title.encode('utf-8')

