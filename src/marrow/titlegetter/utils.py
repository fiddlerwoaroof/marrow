def memoize(cache):
    def _wrapper(function):
        def _inner(*args):
            c_args = args[1:]
            result = cache.get(c_args)
            if result is None:
                result = function(*args)
                cache[c_args] = result
            return result
        return _inner
    return _wrapper


