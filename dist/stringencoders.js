(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stringencoders = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.base64 = factory();
  }
}(this, function() {
/*
 * Copyright (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Additional edits made by Michael Gardner.
 *
 * Copyright (c) 2016 SumTotal Systems, LLC
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* base64 encode/decode compatible with window.btoa/atob
 *
 * window.atob/btoa is a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * It is also found in Safari and Chrome.  It is not available in IE.
 *
 * if (!window.btoa) window.btoa = base64.encode
 * if (!window.atob) window.atob = base64.decode
 *
 * The original spec's for atob/btoa are a bit lacking
 * https://developer.mozilla.org/en/DOM/window.atob
 * https://developer.mozilla.org/en/DOM/window.btoa
 *
 * window.btoa and base64.encode takes a string where charCodeAt is [0,255]
 * If any character is not [0,255], then an DOMException(5) is thrown.
 *
 * window.atob and base64.decode take a base64-encoded string
 * If the input length is not a multiple of 4, or contains invalid characters
 *   then an DOMException(5) is thrown.
 */

var base64 = {};
base64.PADCHAR = '=';
base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

base64.makeDOMException = function () {
  // sadly in FF,Safari,Chrome you can't make a DOMException
  var e, tmp;

  try {
    return new DOMException(DOMException.INVALID_CHARACTER_ERR);
  } catch (tmp) {
    // not available, just passback a duck-typed equiv
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error/prototype
    var ex = new Error("DOM Exception 5");

    // ex.number and ex.description is IE-specific.
    ex.code = ex.number = 5;
    ex.name = ex.description = "INVALID_CHARACTER_ERR";

    // Safari/Chrome output format
    ex.toString = function () {
      return 'Error: ' + ex.name + ': ' + ex.message;
    };
    return ex;
  }
}

base64.getbyte64 = function (s, i) {
  // This is oddly fast, except on Chrome/V8.
  //  Minimal or no improvement in performance by using a
  //   object with properties mapping chars to value (eg. 'A': 0)
  var idx = base64.ALPHA.indexOf(s.charAt(i));
  if (idx === -1) {
    throw base64.makeDOMException();
  }
  return idx;
}

base64.decode = function (s) {
  // convert to string
  s = '' + s;
  var getbyte64 = base64.getbyte64;
  var pads, i, b10;
  var imax = s.length
  if (imax === 0) {
    return s;
  }

  if (imax % 4 !== 0) {
    throw base64.makeDOMException();
  }

  pads = 0
  if (s.charAt(imax - 1) === base64.PADCHAR) {
    pads = 1;
    if (s.charAt(imax - 2) === base64.PADCHAR) {
      pads = 2;
    }
    // either way, we want to ignore this last block
    imax -= 4;
  }

  var x = [];
  for (i = 0; i < imax; i += 4) {
    b10 = (getbyte64(s, i) << 18) | (getbyte64(s, i + 1) << 12) |
      (getbyte64(s, i + 2) << 6) | getbyte64(s, i + 3);
    x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
  }

  switch (pads) {
  case 1:
    b10 = (getbyte64(s, i) << 18) | (getbyte64(s, i + 1) << 12) | (getbyte64(s, i + 2) << 6);
    x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
    break;
  case 2:
    b10 = (getbyte64(s, i) << 18) | (getbyte64(s, i + 1) << 12);
    x.push(String.fromCharCode(b10 >> 16));
    break;
  }
  return x.join('');
}

base64.getbyte = function (s, i) {
  var x = s.charCodeAt(i);
  if (x > 255) {
    throw base64.makeDOMException();
  }
  return x;
}

base64.encode = function (s) {
  if (arguments.length !== 1) {
    throw new SyntaxError("Not enough arguments");
  }
  var padchar = base64.PADCHAR;
  var alpha = base64.ALPHA;
  var getbyte = base64.getbyte;

  var i, b10;
  var x = [];

  // convert to string
  s = '' + s;

  var imax = s.length - s.length % 3;

  if (s.length === 0) {
    return s;
  }
  for (i = 0; i < imax; i += 3) {
    b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8) | getbyte(s, i + 2);
    x.push(alpha.charAt(b10 >> 18));
    x.push(alpha.charAt((b10 >> 12) & 0x3F));
    x.push(alpha.charAt((b10 >> 6) & 0x3f));
    x.push(alpha.charAt(b10 & 0x3f));
  }
  switch (s.length - imax) {
  case 1:
    b10 = getbyte(s, i) << 16;
    x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
      padchar + padchar);
    break;
  case 2:
    b10 = (getbyte(s, i) << 16) | (getbyte(s, i + 1) << 8);
    x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
      alpha.charAt((b10 >> 6) & 0x3f) + padchar);
    break;
  }
  return x.join('');
}

return base64;
}));

},{}],2:[function(require,module,exports){
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./base64', './urlparse'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('./base64'), require('./urlparse'));
  } else {
    root.stringencoders = factory(root.Base64, root.Urlparse);
  }
}(this, function(base64, urlparse) {
'use strict';
var stringencoders = {
  base64: base64,
  urlparse: urlparse
};

return stringencoders;
}));

},{"./base64":1,"./urlparse":3}],3:[function(require,module,exports){
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.urlparse = factory();
  }
}(this, function() {
/*
 * Copyright (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Additional edits made by Michael Gardner.
 *
 * Copyright (c) 2016 SumTotal Systems, LLC
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * url processing in the spirit of python's urlparse module
 * see `pydoc urlparse` or
 * http://docs.python.org/library/urlparse.html
 *
 *  urlsplit: break apart a URL into components
 *  urlunsplit:  reconsistute a URL from componets
 *  urljoin: join an absolute and another URL
 *  urldefrag: remove the fragment from a URL
 *
 * Take a look at the tests in urlparse-test.html
 *
 * On URL Normalization:
 *
 * urlsplit only does minor normalization the components Only scheme
 * and hostname are lowercased urljoin does a bit more, normalizing
 * paths with "."  and "..".

 * urlnormalize adds additional normalization
 *
 *   * removes default port numbers
 *     http://abc.com:80/ -> http://abc.com/, etc
 *   * normalizes path
 *     http://abc.com -> http://abc.com/
 *     and other "." and ".." cleanups
 *   * if file, remove query and fragment
 *
 * It does not do:
 *   * normalizes escaped hex values
 *     http://abc.com/%7efoo -> http://abc.com/%7Efoo
 *   * normalize '+' <--> '%20'
 *
 * Differences with Python
 *
 * The javascript urlsplit returns a normal object with the following
 * properties: scheme, netloc, hostname, port, path, query, fragment.
 * All properties are read-write.
 *
 * In python, the resulting object is not a dict, but a specialized,
 * read-only, and has alternative tuple interface (e.g. obj[0] ==
 * obj.scheme).  It's not clear why such a simple function requires
 * a unique datastructure.
 *
 * urlunsplit in javascript takes an duck-typed object,
 *  { scheme: 'http', netloc: 'abc.com', ...}
 *  while in  * python it takes a list-like object.
 *  ['http', 'abc.com'... ]
 *
 * For all functions, the javascript version use
 * hostname+port if netloc is missing.  In python
 * hostname+port were always ignored.
 *
 * Similar functionality in different languages:
 *
 *   http://php.net/manual/en/function.parse-url.php
 *   returns assocative array but cannot handle relative URL
 *
 * TODO: test allowfragments more
 * TODO: test netloc missing, but hostname present
 */


'use strict';
var urlparse = {};

// Unlike to be useful standalone
//
// NORMALIZE PATH with "../" and "./"
//   http://en.wikipedia.org/wiki/URL_normalization
//   http://tools.ietf.org/html/rfc3986#section-5.2.3
//
urlparse.normalizepath = function (path) {
  if (!path || path === '/') {
    return '/';
  }

  var parts = path.split('/');

  var newparts = [];
  // make sure path always starts with '/'
  if (parts[0]) {
    newparts.push('');
  }

  for (var i = 0; i < parts.length; ++i) {
    if (parts[i] === '..') {
      if (newparts.length > 1) {
        newparts.pop();
      } else {
        newparts.push(parts[i]);
      }
    } else if (parts[i] != '.') {
      newparts.push(parts[i]);
    }
  }

  path = newparts.join('/');
  if (!path) {
    path = '/';
  }
  return path;
};

//
// Does many of the normalizations that the stock
//  python urlsplit/urlunsplit/urljoin neglects
//
// Doesn't do hex-escape normalization on path or query
//   %7e -> %7E
// Nor, '+' <--> %20 translation
//
urlparse.urlnormalize = function (url) {
  var parts = urlparse.urlsplit(url);
  switch (parts.scheme) {
  case 'file':
    // files can't have query strings
    //  and we don't bother with fragments
    parts.query = '';
    parts.fragment = '';
    break;
  case 'http':
  case 'https':
    // remove default port
    if ((parts.scheme === 'http' && parts.port == 80) ||
      (parts.scheme === 'https' && parts.port == 443)) {
      delete parts.port;
      // hostname is already lower case
      parts.netloc = parts.hostname;
    }
    break;
  default:
    // if we don't have specific normalizations for this
    // scheme, return the original url unmolested
    return url;
  }

  // for [file|http|https].  Not sure about other schemes
  parts.path = urlparse.normalizepath(parts.path);

  return urlparse.urlunsplit(parts);
};

urlparse.urldefrag = function (url) {
  var idx = url.indexOf('#');
  if (idx == -1) {
    return [url, ''];
  } else {
    return [url.substr(0, idx), url.substr(idx + 1)];
  }
};

urlparse.urlsplit = function (url, default_scheme, allow_fragments) {
  var leftover;
  if (typeof allow_fragments === 'undefined') {
    allow_fragments = true;
  }

  // scheme (optional), host, port
  var fullurl = /^([A-Za-z]+)?(:?\/\/)([0-9.\-A-Za-z]*)(?::(\d+))?(.*)$/;
  // path, query, fragment
  var parse_leftovers = /([^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/;

  var o = {};

  var parts = url.match(fullurl);
  if (parts) {
    o.scheme = parts[1] || default_scheme || '';
    o.hostname = parts[3].toLowerCase() || '';
    o.port = parseInt(parts[4], 10) || '';
    // Probably should grab the netloc from regexp
    //  and then parse again for hostname/port

    o.netloc = parts[3];
    if (parts[4]) {
      o.netloc += ':' + parts[4];
    }

    leftover = parts[5];
  } else {
    o.scheme = default_scheme || '';
    o.netloc = '';
    o.hostname = '';
    leftover = url;
  }
  o.scheme = o.scheme.toLowerCase();

  parts = leftover.match(parse_leftovers);

  o.path = parts[1] || '';
  o.query = parts[2] || '';

  if (allow_fragments) {
    o.fragment = parts[3] || '';
  } else {
    o.fragment = '';
  }

  return o;
};

urlparse.urlunsplit = function (o) {
  var s = '';
  if (o.scheme) {
    s += o.scheme + '://';
  }

  if (o.netloc) {
    if (s === '') {
      s += '//';
    }
    s += o.netloc;
  } else if (o.hostname) {
    // extension.  Python only uses netloc
    if (s === '') {
      s += '//';
    }
    s += o.hostname;
    if (o.port) {
      s += ':' + o.port;
    }
  }

  if (o.path) {
    s += o.path;
  }

  if (o.query) {
    s += '?' + o.query;
  }
  if (o.fragment) {
    s += '#' + o.fragment;
  }
  return s;
};

urlparse.urljoin = function (base, url, allow_fragments) {
  if (typeof allow_fragments === 'undefined') {
    allow_fragments = true;
  }

  var url_parts = urlparse.urlsplit(url);

  // if url parts has a scheme (i.e. absolute)
  // then nothing to do
  if (url_parts.scheme) {
    if (!allow_fragments) {
      return url;
    } else {
      return urlparse.urldefrag(url)[0];
    }
  }
  var base_parts = urlparse.urlsplit(base);

  // copy base, only if not present
  if (!base_parts.scheme) {
    base_parts.scheme = url_parts.scheme;
  }

  // copy netloc, only if not present
  if (!base_parts.netloc || !base_parts.hostname) {
    base_parts.netloc = url_parts.netloc;
    base_parts.hostname = url_parts.hostname;
    base_parts.port = url_parts.port;
  }

  // paths
  if (url_parts.path.length > 0) {
    if (url_parts.path.charAt(0) == '/') {
      base_parts.path = url_parts.path;
    } else {
      // relative path.. get rid of "current filename" and
      //   replace.  Same as var parts =
      //   base_parts.path.split('/'); parts[parts.length-1] =
      //   url_parts.path; base_parts.path = parts.join('/');
      var idx = base_parts.path.lastIndexOf('/');
      if (idx == -1) {
        base_parts.path = url_parts.path;
      } else {
        base_parts.path = base_parts.path.substr(0, idx) + '/' +
          url_parts.path;
      }
    }
  }

  // clean up path
  base_parts.path = urlparse.normalizepath(base_parts.path);

  // copy query string
  base_parts.query = url_parts.query;

  // copy fragments
  if (allow_fragments) {
    base_parts.fragment = url_parts.fragment;
  } else {
    base_parts.fragment = '';
  }

  return urlparse.urlunsplit(base_parts);
};

return urlparse;
}));

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2Jhc2U2NC5qcyIsImRpc3Qvc3RyaW5nZW5jb2RlcnMuanMiLCJkaXN0L3VybHBhcnNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjsoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICByb290LmJhc2U2NCA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbigpIHtcbi8qXHJcbiAqIENvcHlyaWdodCAoYykgMjAxMCBOaWNrIEdhbGJyZWF0aFxyXG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3Avc3RyaW5nZW5jb2RlcnMvc291cmNlL2Jyb3dzZS8jc3ZuL3RydW5rL2phdmFzY3JpcHRcclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cclxuICogb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb25cclxuICogZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0XHJcbiAqIHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLFxyXG4gKiBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGVcclxuICogU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcclxuICogY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcclxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXHJcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFU1xyXG4gKiBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxyXG4gKiBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVFxyXG4gKiBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcclxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HXHJcbiAqIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1JcclxuICogT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG4gKi9cclxuXHJcbi8qXHJcbiAqIEFkZGl0aW9uYWwgZWRpdHMgbWFkZSBieSBNaWNoYWVsIEdhcmRuZXIuXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNiBTdW1Ub3RhbCBTeXN0ZW1zLCBMTENcclxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3N0cmluZ2VuY29kZXJzL3NvdXJjZS9icm93c2UvI3N2bi90cnVuay9qYXZhc2NyaXB0XHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uXHJcbiAqIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uXHJcbiAqIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dFxyXG4gKiByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSxcclxuICogY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlXHJcbiAqIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXHJcbiAqIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXHJcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxyXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVNcclxuICogT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcclxuICogTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFRcclxuICogSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXHJcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lOR1xyXG4gKiBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SXHJcbiAqIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cclxuICovXHJcblxyXG4vKiBiYXNlNjQgZW5jb2RlL2RlY29kZSBjb21wYXRpYmxlIHdpdGggd2luZG93LmJ0b2EvYXRvYlxyXG4gKlxyXG4gKiB3aW5kb3cuYXRvYi9idG9hIGlzIGEgRmlyZWZveCBleHRlbnNpb24gdG8gY29udmVydCBiaW5hcnkgZGF0YSAodGhlIFwiYlwiKVxyXG4gKiB0byBiYXNlNjQgKGFzY2lpLCB0aGUgXCJhXCIpLlxyXG4gKlxyXG4gKiBJdCBpcyBhbHNvIGZvdW5kIGluIFNhZmFyaSBhbmQgQ2hyb21lLiAgSXQgaXMgbm90IGF2YWlsYWJsZSBpbiBJRS5cclxuICpcclxuICogaWYgKCF3aW5kb3cuYnRvYSkgd2luZG93LmJ0b2EgPSBiYXNlNjQuZW5jb2RlXHJcbiAqIGlmICghd2luZG93LmF0b2IpIHdpbmRvdy5hdG9iID0gYmFzZTY0LmRlY29kZVxyXG4gKlxyXG4gKiBUaGUgb3JpZ2luYWwgc3BlYydzIGZvciBhdG9iL2J0b2EgYXJlIGEgYml0IGxhY2tpbmdcclxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vRE9NL3dpbmRvdy5hdG9iXHJcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS93aW5kb3cuYnRvYVxyXG4gKlxyXG4gKiB3aW5kb3cuYnRvYSBhbmQgYmFzZTY0LmVuY29kZSB0YWtlcyBhIHN0cmluZyB3aGVyZSBjaGFyQ29kZUF0IGlzIFswLDI1NV1cclxuICogSWYgYW55IGNoYXJhY3RlciBpcyBub3QgWzAsMjU1XSwgdGhlbiBhbiBET01FeGNlcHRpb24oNSkgaXMgdGhyb3duLlxyXG4gKlxyXG4gKiB3aW5kb3cuYXRvYiBhbmQgYmFzZTY0LmRlY29kZSB0YWtlIGEgYmFzZTY0LWVuY29kZWQgc3RyaW5nXHJcbiAqIElmIHRoZSBpbnB1dCBsZW5ndGggaXMgbm90IGEgbXVsdGlwbGUgb2YgNCwgb3IgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzXHJcbiAqICAgdGhlbiBhbiBET01FeGNlcHRpb24oNSkgaXMgdGhyb3duLlxyXG4gKi9cclxuXHJcbnZhciBiYXNlNjQgPSB7fTtcclxuYmFzZTY0LlBBRENIQVIgPSAnPSc7XHJcbmJhc2U2NC5BTFBIQSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcclxuXHJcbmJhc2U2NC5tYWtlRE9NRXhjZXB0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIHNhZGx5IGluIEZGLFNhZmFyaSxDaHJvbWUgeW91IGNhbid0IG1ha2UgYSBET01FeGNlcHRpb25cclxuICB2YXIgZSwgdG1wO1xyXG5cclxuICB0cnkge1xyXG4gICAgcmV0dXJuIG5ldyBET01FeGNlcHRpb24oRE9NRXhjZXB0aW9uLklOVkFMSURfQ0hBUkFDVEVSX0VSUik7XHJcbiAgfSBjYXRjaCAodG1wKSB7XHJcbiAgICAvLyBub3QgYXZhaWxhYmxlLCBqdXN0IHBhc3NiYWNrIGEgZHVjay10eXBlZCBlcXVpdlxyXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ29yZV9KYXZhU2NyaXB0XzEuNV9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRXJyb3JcclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NvcmVfSmF2YVNjcmlwdF8xLjVfUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Vycm9yL3Byb3RvdHlwZVxyXG4gICAgdmFyIGV4ID0gbmV3IEVycm9yKFwiRE9NIEV4Y2VwdGlvbiA1XCIpO1xyXG5cclxuICAgIC8vIGV4Lm51bWJlciBhbmQgZXguZGVzY3JpcHRpb24gaXMgSUUtc3BlY2lmaWMuXHJcbiAgICBleC5jb2RlID0gZXgubnVtYmVyID0gNTtcclxuICAgIGV4Lm5hbWUgPSBleC5kZXNjcmlwdGlvbiA9IFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCI7XHJcblxyXG4gICAgLy8gU2FmYXJpL0Nocm9tZSBvdXRwdXQgZm9ybWF0XHJcbiAgICBleC50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICdFcnJvcjogJyArIGV4Lm5hbWUgKyAnOiAnICsgZXgubWVzc2FnZTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gZXg7XHJcbiAgfVxyXG59XHJcblxyXG5iYXNlNjQuZ2V0Ynl0ZTY0ID0gZnVuY3Rpb24gKHMsIGkpIHtcclxuICAvLyBUaGlzIGlzIG9kZGx5IGZhc3QsIGV4Y2VwdCBvbiBDaHJvbWUvVjguXHJcbiAgLy8gIE1pbmltYWwgb3Igbm8gaW1wcm92ZW1lbnQgaW4gcGVyZm9ybWFuY2UgYnkgdXNpbmcgYVxyXG4gIC8vICAgb2JqZWN0IHdpdGggcHJvcGVydGllcyBtYXBwaW5nIGNoYXJzIHRvIHZhbHVlIChlZy4gJ0EnOiAwKVxyXG4gIHZhciBpZHggPSBiYXNlNjQuQUxQSEEuaW5kZXhPZihzLmNoYXJBdChpKSk7XHJcbiAgaWYgKGlkeCA9PT0gLTEpIHtcclxuICAgIHRocm93IGJhc2U2NC5tYWtlRE9NRXhjZXB0aW9uKCk7XHJcbiAgfVxyXG4gIHJldHVybiBpZHg7XHJcbn1cclxuXHJcbmJhc2U2NC5kZWNvZGUgPSBmdW5jdGlvbiAocykge1xyXG4gIC8vIGNvbnZlcnQgdG8gc3RyaW5nXHJcbiAgcyA9ICcnICsgcztcclxuICB2YXIgZ2V0Ynl0ZTY0ID0gYmFzZTY0LmdldGJ5dGU2NDtcclxuICB2YXIgcGFkcywgaSwgYjEwO1xyXG4gIHZhciBpbWF4ID0gcy5sZW5ndGhcclxuICBpZiAoaW1heCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIHM7XHJcbiAgfVxyXG5cclxuICBpZiAoaW1heCAlIDQgIT09IDApIHtcclxuICAgIHRocm93IGJhc2U2NC5tYWtlRE9NRXhjZXB0aW9uKCk7XHJcbiAgfVxyXG5cclxuICBwYWRzID0gMFxyXG4gIGlmIChzLmNoYXJBdChpbWF4IC0gMSkgPT09IGJhc2U2NC5QQURDSEFSKSB7XHJcbiAgICBwYWRzID0gMTtcclxuICAgIGlmIChzLmNoYXJBdChpbWF4IC0gMikgPT09IGJhc2U2NC5QQURDSEFSKSB7XHJcbiAgICAgIHBhZHMgPSAyO1xyXG4gICAgfVxyXG4gICAgLy8gZWl0aGVyIHdheSwgd2Ugd2FudCB0byBpZ25vcmUgdGhpcyBsYXN0IGJsb2NrXHJcbiAgICBpbWF4IC09IDQ7XHJcbiAgfVxyXG5cclxuICB2YXIgeCA9IFtdO1xyXG4gIGZvciAoaSA9IDA7IGkgPCBpbWF4OyBpICs9IDQpIHtcclxuICAgIGIxMCA9IChnZXRieXRlNjQocywgaSkgPDwgMTgpIHwgKGdldGJ5dGU2NChzLCBpICsgMSkgPDwgMTIpIHxcclxuICAgICAgKGdldGJ5dGU2NChzLCBpICsgMikgPDwgNikgfCBnZXRieXRlNjQocywgaSArIDMpO1xyXG4gICAgeC5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYjEwID4+IDE2LCAoYjEwID4+IDgpICYgMHhmZiwgYjEwICYgMHhmZikpO1xyXG4gIH1cclxuXHJcbiAgc3dpdGNoIChwYWRzKSB7XHJcbiAgY2FzZSAxOlxyXG4gICAgYjEwID0gKGdldGJ5dGU2NChzLCBpKSA8PCAxOCkgfCAoZ2V0Ynl0ZTY0KHMsIGkgKyAxKSA8PCAxMikgfCAoZ2V0Ynl0ZTY0KHMsIGkgKyAyKSA8PCA2KTtcclxuICAgIHgucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlKGIxMCA+PiAxNiwgKGIxMCA+PiA4KSAmIDB4ZmYpKTtcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgMjpcclxuICAgIGIxMCA9IChnZXRieXRlNjQocywgaSkgPDwgMTgpIHwgKGdldGJ5dGU2NChzLCBpICsgMSkgPDwgMTIpO1xyXG4gICAgeC5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYjEwID4+IDE2KSk7XHJcbiAgICBicmVhaztcclxuICB9XHJcbiAgcmV0dXJuIHguam9pbignJyk7XHJcbn1cclxuXHJcbmJhc2U2NC5nZXRieXRlID0gZnVuY3Rpb24gKHMsIGkpIHtcclxuICB2YXIgeCA9IHMuY2hhckNvZGVBdChpKTtcclxuICBpZiAoeCA+IDI1NSkge1xyXG4gICAgdGhyb3cgYmFzZTY0Lm1ha2VET01FeGNlcHRpb24oKTtcclxuICB9XHJcbiAgcmV0dXJuIHg7XHJcbn1cclxuXHJcbmJhc2U2NC5lbmNvZGUgPSBmdW5jdGlvbiAocykge1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJOb3QgZW5vdWdoIGFyZ3VtZW50c1wiKTtcclxuICB9XHJcbiAgdmFyIHBhZGNoYXIgPSBiYXNlNjQuUEFEQ0hBUjtcclxuICB2YXIgYWxwaGEgPSBiYXNlNjQuQUxQSEE7XHJcbiAgdmFyIGdldGJ5dGUgPSBiYXNlNjQuZ2V0Ynl0ZTtcclxuXHJcbiAgdmFyIGksIGIxMDtcclxuICB2YXIgeCA9IFtdO1xyXG5cclxuICAvLyBjb252ZXJ0IHRvIHN0cmluZ1xyXG4gIHMgPSAnJyArIHM7XHJcblxyXG4gIHZhciBpbWF4ID0gcy5sZW5ndGggLSBzLmxlbmd0aCAlIDM7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIHM7XHJcbiAgfVxyXG4gIGZvciAoaSA9IDA7IGkgPCBpbWF4OyBpICs9IDMpIHtcclxuICAgIGIxMCA9IChnZXRieXRlKHMsIGkpIDw8IDE2KSB8IChnZXRieXRlKHMsIGkgKyAxKSA8PCA4KSB8IGdldGJ5dGUocywgaSArIDIpO1xyXG4gICAgeC5wdXNoKGFscGhhLmNoYXJBdChiMTAgPj4gMTgpKTtcclxuICAgIHgucHVzaChhbHBoYS5jaGFyQXQoKGIxMCA+PiAxMikgJiAweDNGKSk7XHJcbiAgICB4LnB1c2goYWxwaGEuY2hhckF0KChiMTAgPj4gNikgJiAweDNmKSk7XHJcbiAgICB4LnB1c2goYWxwaGEuY2hhckF0KGIxMCAmIDB4M2YpKTtcclxuICB9XHJcbiAgc3dpdGNoIChzLmxlbmd0aCAtIGltYXgpIHtcclxuICBjYXNlIDE6XHJcbiAgICBiMTAgPSBnZXRieXRlKHMsIGkpIDw8IDE2O1xyXG4gICAgeC5wdXNoKGFscGhhLmNoYXJBdChiMTAgPj4gMTgpICsgYWxwaGEuY2hhckF0KChiMTAgPj4gMTIpICYgMHgzRikgK1xyXG4gICAgICBwYWRjaGFyICsgcGFkY2hhcik7XHJcbiAgICBicmVhaztcclxuICBjYXNlIDI6XHJcbiAgICBiMTAgPSAoZ2V0Ynl0ZShzLCBpKSA8PCAxNikgfCAoZ2V0Ynl0ZShzLCBpICsgMSkgPDwgOCk7XHJcbiAgICB4LnB1c2goYWxwaGEuY2hhckF0KGIxMCA+PiAxOCkgKyBhbHBoYS5jaGFyQXQoKGIxMCA+PiAxMikgJiAweDNGKSArXHJcbiAgICAgIGFscGhhLmNoYXJBdCgoYjEwID4+IDYpICYgMHgzZikgKyBwYWRjaGFyKTtcclxuICAgIGJyZWFrO1xyXG4gIH1cclxuICByZXR1cm4geC5qb2luKCcnKTtcclxufVxyXG5cbnJldHVybiBiYXNlNjQ7XG59KSk7XG4iLCI7KGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJy4vYmFzZTY0JywgJy4vdXJscGFyc2UnXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vYmFzZTY0JyksIHJlcXVpcmUoJy4vdXJscGFyc2UnKSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5zdHJpbmdlbmNvZGVycyA9IGZhY3Rvcnkocm9vdC5CYXNlNjQsIHJvb3QuVXJscGFyc2UpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKGJhc2U2NCwgdXJscGFyc2UpIHtcbid1c2Ugc3RyaWN0JztcclxudmFyIHN0cmluZ2VuY29kZXJzID0ge1xyXG4gIGJhc2U2NDogYmFzZTY0LFxyXG4gIHVybHBhcnNlOiB1cmxwYXJzZVxyXG59O1xyXG5cbnJldHVybiBzdHJpbmdlbmNvZGVycztcbn0pKTtcbiIsIjsoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICByb290LnVybHBhcnNlID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKCkge1xuLypcclxuICogQ29weXJpZ2h0IChjKSAyMDEwIE5pY2sgR2FsYnJlYXRoXHJcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9zdHJpbmdlbmNvZGVycy9zb3VyY2UvYnJvd3NlLyNzdm4vdHJ1bmsvamF2YXNjcmlwdFxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxyXG4gKiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvblxyXG4gKiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXRcclxuICogcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsXHJcbiAqIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZVxyXG4gKiBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xyXG4gKiBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxyXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcclxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTXHJcbiAqIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXHJcbiAqIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUXHJcbiAqIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxyXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkdcclxuICogRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUlxyXG4gKiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcbiAqL1xyXG5cclxuLypcclxuICogQWRkaXRpb25hbCBlZGl0cyBtYWRlIGJ5IE1pY2hhZWwgR2FyZG5lci5cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE2IFN1bVRvdGFsIFN5c3RlbXMsIExMQ1xyXG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3Avc3RyaW5nZW5jb2RlcnMvc291cmNlL2Jyb3dzZS8jc3ZuL3RydW5rL2phdmFzY3JpcHRcclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cclxuICogb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb25cclxuICogZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0XHJcbiAqIHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLFxyXG4gKiBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGVcclxuICogU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcclxuICogY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcclxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXHJcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFU1xyXG4gKiBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxyXG4gKiBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVFxyXG4gKiBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcclxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HXHJcbiAqIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1JcclxuICogT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG4gKi9cclxuXHJcbi8qXHJcbiAqIHVybCBwcm9jZXNzaW5nIGluIHRoZSBzcGlyaXQgb2YgcHl0aG9uJ3MgdXJscGFyc2UgbW9kdWxlXHJcbiAqIHNlZSBgcHlkb2MgdXJscGFyc2VgIG9yXHJcbiAqIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91cmxwYXJzZS5odG1sXHJcbiAqXHJcbiAqICB1cmxzcGxpdDogYnJlYWsgYXBhcnQgYSBVUkwgaW50byBjb21wb25lbnRzXHJcbiAqICB1cmx1bnNwbGl0OiAgcmVjb25zaXN0dXRlIGEgVVJMIGZyb20gY29tcG9uZXRzXHJcbiAqICB1cmxqb2luOiBqb2luIGFuIGFic29sdXRlIGFuZCBhbm90aGVyIFVSTFxyXG4gKiAgdXJsZGVmcmFnOiByZW1vdmUgdGhlIGZyYWdtZW50IGZyb20gYSBVUkxcclxuICpcclxuICogVGFrZSBhIGxvb2sgYXQgdGhlIHRlc3RzIGluIHVybHBhcnNlLXRlc3QuaHRtbFxyXG4gKlxyXG4gKiBPbiBVUkwgTm9ybWFsaXphdGlvbjpcclxuICpcclxuICogdXJsc3BsaXQgb25seSBkb2VzIG1pbm9yIG5vcm1hbGl6YXRpb24gdGhlIGNvbXBvbmVudHMgT25seSBzY2hlbWVcclxuICogYW5kIGhvc3RuYW1lIGFyZSBsb3dlcmNhc2VkIHVybGpvaW4gZG9lcyBhIGJpdCBtb3JlLCBub3JtYWxpemluZ1xyXG4gKiBwYXRocyB3aXRoIFwiLlwiICBhbmQgXCIuLlwiLlxyXG5cclxuICogdXJsbm9ybWFsaXplIGFkZHMgYWRkaXRpb25hbCBub3JtYWxpemF0aW9uXHJcbiAqXHJcbiAqICAgKiByZW1vdmVzIGRlZmF1bHQgcG9ydCBudW1iZXJzXHJcbiAqICAgICBodHRwOi8vYWJjLmNvbTo4MC8gLT4gaHR0cDovL2FiYy5jb20vLCBldGNcclxuICogICAqIG5vcm1hbGl6ZXMgcGF0aFxyXG4gKiAgICAgaHR0cDovL2FiYy5jb20gLT4gaHR0cDovL2FiYy5jb20vXHJcbiAqICAgICBhbmQgb3RoZXIgXCIuXCIgYW5kIFwiLi5cIiBjbGVhbnVwc1xyXG4gKiAgICogaWYgZmlsZSwgcmVtb3ZlIHF1ZXJ5IGFuZCBmcmFnbWVudFxyXG4gKlxyXG4gKiBJdCBkb2VzIG5vdCBkbzpcclxuICogICAqIG5vcm1hbGl6ZXMgZXNjYXBlZCBoZXggdmFsdWVzXHJcbiAqICAgICBodHRwOi8vYWJjLmNvbS8lN2Vmb28gLT4gaHR0cDovL2FiYy5jb20vJTdFZm9vXHJcbiAqICAgKiBub3JtYWxpemUgJysnIDwtLT4gJyUyMCdcclxuICpcclxuICogRGlmZmVyZW5jZXMgd2l0aCBQeXRob25cclxuICpcclxuICogVGhlIGphdmFzY3JpcHQgdXJsc3BsaXQgcmV0dXJucyBhIG5vcm1hbCBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nXHJcbiAqIHByb3BlcnRpZXM6IHNjaGVtZSwgbmV0bG9jLCBob3N0bmFtZSwgcG9ydCwgcGF0aCwgcXVlcnksIGZyYWdtZW50LlxyXG4gKiBBbGwgcHJvcGVydGllcyBhcmUgcmVhZC13cml0ZS5cclxuICpcclxuICogSW4gcHl0aG9uLCB0aGUgcmVzdWx0aW5nIG9iamVjdCBpcyBub3QgYSBkaWN0LCBidXQgYSBzcGVjaWFsaXplZCxcclxuICogcmVhZC1vbmx5LCBhbmQgaGFzIGFsdGVybmF0aXZlIHR1cGxlIGludGVyZmFjZSAoZS5nLiBvYmpbMF0gPT1cclxuICogb2JqLnNjaGVtZSkuICBJdCdzIG5vdCBjbGVhciB3aHkgc3VjaCBhIHNpbXBsZSBmdW5jdGlvbiByZXF1aXJlc1xyXG4gKiBhIHVuaXF1ZSBkYXRhc3RydWN0dXJlLlxyXG4gKlxyXG4gKiB1cmx1bnNwbGl0IGluIGphdmFzY3JpcHQgdGFrZXMgYW4gZHVjay10eXBlZCBvYmplY3QsXHJcbiAqICB7IHNjaGVtZTogJ2h0dHAnLCBuZXRsb2M6ICdhYmMuY29tJywgLi4ufVxyXG4gKiAgd2hpbGUgaW4gICogcHl0aG9uIGl0IHRha2VzIGEgbGlzdC1saWtlIG9iamVjdC5cclxuICogIFsnaHR0cCcsICdhYmMuY29tJy4uLiBdXHJcbiAqXHJcbiAqIEZvciBhbGwgZnVuY3Rpb25zLCB0aGUgamF2YXNjcmlwdCB2ZXJzaW9uIHVzZVxyXG4gKiBob3N0bmFtZStwb3J0IGlmIG5ldGxvYyBpcyBtaXNzaW5nLiAgSW4gcHl0aG9uXHJcbiAqIGhvc3RuYW1lK3BvcnQgd2VyZSBhbHdheXMgaWdub3JlZC5cclxuICpcclxuICogU2ltaWxhciBmdW5jdGlvbmFsaXR5IGluIGRpZmZlcmVudCBsYW5ndWFnZXM6XHJcbiAqXHJcbiAqICAgaHR0cDovL3BocC5uZXQvbWFudWFsL2VuL2Z1bmN0aW9uLnBhcnNlLXVybC5waHBcclxuICogICByZXR1cm5zIGFzc29jYXRpdmUgYXJyYXkgYnV0IGNhbm5vdCBoYW5kbGUgcmVsYXRpdmUgVVJMXHJcbiAqXHJcbiAqIFRPRE86IHRlc3QgYWxsb3dmcmFnbWVudHMgbW9yZVxyXG4gKiBUT0RPOiB0ZXN0IG5ldGxvYyBtaXNzaW5nLCBidXQgaG9zdG5hbWUgcHJlc2VudFxyXG4gKi9cclxuXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcbnZhciB1cmxwYXJzZSA9IHt9O1xyXG5cclxuLy8gVW5saWtlIHRvIGJlIHVzZWZ1bCBzdGFuZGFsb25lXHJcbi8vXHJcbi8vIE5PUk1BTElaRSBQQVRIIHdpdGggXCIuLi9cIiBhbmQgXCIuL1wiXHJcbi8vICAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9VUkxfbm9ybWFsaXphdGlvblxyXG4vLyAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYjc2VjdGlvbi01LjIuM1xyXG4vL1xyXG51cmxwYXJzZS5ub3JtYWxpemVwYXRoID0gZnVuY3Rpb24gKHBhdGgpIHtcclxuICBpZiAoIXBhdGggfHwgcGF0aCA9PT0gJy8nKSB7XHJcbiAgICByZXR1cm4gJy8nO1xyXG4gIH1cclxuXHJcbiAgdmFyIHBhcnRzID0gcGF0aC5zcGxpdCgnLycpO1xyXG5cclxuICB2YXIgbmV3cGFydHMgPSBbXTtcclxuICAvLyBtYWtlIHN1cmUgcGF0aCBhbHdheXMgc3RhcnRzIHdpdGggJy8nXHJcbiAgaWYgKHBhcnRzWzBdKSB7XHJcbiAgICBuZXdwYXJ0cy5wdXNoKCcnKTtcclxuICB9XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcclxuICAgIGlmIChwYXJ0c1tpXSA9PT0gJy4uJykge1xyXG4gICAgICBpZiAobmV3cGFydHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIG5ld3BhcnRzLnBvcCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5ld3BhcnRzLnB1c2gocGFydHNbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKHBhcnRzW2ldICE9ICcuJykge1xyXG4gICAgICBuZXdwYXJ0cy5wdXNoKHBhcnRzW2ldKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHBhdGggPSBuZXdwYXJ0cy5qb2luKCcvJyk7XHJcbiAgaWYgKCFwYXRoKSB7XHJcbiAgICBwYXRoID0gJy8nO1xyXG4gIH1cclxuICByZXR1cm4gcGF0aDtcclxufTtcclxuXHJcbi8vXHJcbi8vIERvZXMgbWFueSBvZiB0aGUgbm9ybWFsaXphdGlvbnMgdGhhdCB0aGUgc3RvY2tcclxuLy8gIHB5dGhvbiB1cmxzcGxpdC91cmx1bnNwbGl0L3VybGpvaW4gbmVnbGVjdHNcclxuLy9cclxuLy8gRG9lc24ndCBkbyBoZXgtZXNjYXBlIG5vcm1hbGl6YXRpb24gb24gcGF0aCBvciBxdWVyeVxyXG4vLyAgICU3ZSAtPiAlN0VcclxuLy8gTm9yLCAnKycgPC0tPiAlMjAgdHJhbnNsYXRpb25cclxuLy9cclxudXJscGFyc2UudXJsbm9ybWFsaXplID0gZnVuY3Rpb24gKHVybCkge1xyXG4gIHZhciBwYXJ0cyA9IHVybHBhcnNlLnVybHNwbGl0KHVybCk7XHJcbiAgc3dpdGNoIChwYXJ0cy5zY2hlbWUpIHtcclxuICBjYXNlICdmaWxlJzpcclxuICAgIC8vIGZpbGVzIGNhbid0IGhhdmUgcXVlcnkgc3RyaW5nc1xyXG4gICAgLy8gIGFuZCB3ZSBkb24ndCBib3RoZXIgd2l0aCBmcmFnbWVudHNcclxuICAgIHBhcnRzLnF1ZXJ5ID0gJyc7XHJcbiAgICBwYXJ0cy5mcmFnbWVudCA9ICcnO1xyXG4gICAgYnJlYWs7XHJcbiAgY2FzZSAnaHR0cCc6XHJcbiAgY2FzZSAnaHR0cHMnOlxyXG4gICAgLy8gcmVtb3ZlIGRlZmF1bHQgcG9ydFxyXG4gICAgaWYgKChwYXJ0cy5zY2hlbWUgPT09ICdodHRwJyAmJiBwYXJ0cy5wb3J0ID09IDgwKSB8fFxyXG4gICAgICAocGFydHMuc2NoZW1lID09PSAnaHR0cHMnICYmIHBhcnRzLnBvcnQgPT0gNDQzKSkge1xyXG4gICAgICBkZWxldGUgcGFydHMucG9ydDtcclxuICAgICAgLy8gaG9zdG5hbWUgaXMgYWxyZWFkeSBsb3dlciBjYXNlXHJcbiAgICAgIHBhcnRzLm5ldGxvYyA9IHBhcnRzLmhvc3RuYW1lO1xyXG4gICAgfVxyXG4gICAgYnJlYWs7XHJcbiAgZGVmYXVsdDpcclxuICAgIC8vIGlmIHdlIGRvbid0IGhhdmUgc3BlY2lmaWMgbm9ybWFsaXphdGlvbnMgZm9yIHRoaXNcclxuICAgIC8vIHNjaGVtZSwgcmV0dXJuIHRoZSBvcmlnaW5hbCB1cmwgdW5tb2xlc3RlZFxyXG4gICAgcmV0dXJuIHVybDtcclxuICB9XHJcblxyXG4gIC8vIGZvciBbZmlsZXxodHRwfGh0dHBzXS4gIE5vdCBzdXJlIGFib3V0IG90aGVyIHNjaGVtZXNcclxuICBwYXJ0cy5wYXRoID0gdXJscGFyc2Uubm9ybWFsaXplcGF0aChwYXJ0cy5wYXRoKTtcclxuXHJcbiAgcmV0dXJuIHVybHBhcnNlLnVybHVuc3BsaXQocGFydHMpO1xyXG59O1xyXG5cclxudXJscGFyc2UudXJsZGVmcmFnID0gZnVuY3Rpb24gKHVybCkge1xyXG4gIHZhciBpZHggPSB1cmwuaW5kZXhPZignIycpO1xyXG4gIGlmIChpZHggPT0gLTEpIHtcclxuICAgIHJldHVybiBbdXJsLCAnJ107XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBbdXJsLnN1YnN0cigwLCBpZHgpLCB1cmwuc3Vic3RyKGlkeCArIDEpXTtcclxuICB9XHJcbn07XHJcblxyXG51cmxwYXJzZS51cmxzcGxpdCA9IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRfc2NoZW1lLCBhbGxvd19mcmFnbWVudHMpIHtcclxuICB2YXIgbGVmdG92ZXI7XHJcbiAgaWYgKHR5cGVvZiBhbGxvd19mcmFnbWVudHMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBhbGxvd19mcmFnbWVudHMgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gc2NoZW1lIChvcHRpb25hbCksIGhvc3QsIHBvcnRcclxuICB2YXIgZnVsbHVybCA9IC9eKFtBLVphLXpdKyk/KDo/XFwvXFwvKShbMC05LlxcLUEtWmEtel0qKSg/OjooXFxkKykpPyguKikkLztcclxuICAvLyBwYXRoLCBxdWVyeSwgZnJhZ21lbnRcclxuICB2YXIgcGFyc2VfbGVmdG92ZXJzID0gLyhbXj8jXSopPyg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8kLztcclxuXHJcbiAgdmFyIG8gPSB7fTtcclxuXHJcbiAgdmFyIHBhcnRzID0gdXJsLm1hdGNoKGZ1bGx1cmwpO1xyXG4gIGlmIChwYXJ0cykge1xyXG4gICAgby5zY2hlbWUgPSBwYXJ0c1sxXSB8fCBkZWZhdWx0X3NjaGVtZSB8fCAnJztcclxuICAgIG8uaG9zdG5hbWUgPSBwYXJ0c1szXS50b0xvd2VyQ2FzZSgpIHx8ICcnO1xyXG4gICAgby5wb3J0ID0gcGFyc2VJbnQocGFydHNbNF0sIDEwKSB8fCAnJztcclxuICAgIC8vIFByb2JhYmx5IHNob3VsZCBncmFiIHRoZSBuZXRsb2MgZnJvbSByZWdleHBcclxuICAgIC8vICBhbmQgdGhlbiBwYXJzZSBhZ2FpbiBmb3IgaG9zdG5hbWUvcG9ydFxyXG5cclxuICAgIG8ubmV0bG9jID0gcGFydHNbM107XHJcbiAgICBpZiAocGFydHNbNF0pIHtcclxuICAgICAgby5uZXRsb2MgKz0gJzonICsgcGFydHNbNF07XHJcbiAgICB9XHJcblxyXG4gICAgbGVmdG92ZXIgPSBwYXJ0c1s1XTtcclxuICB9IGVsc2Uge1xyXG4gICAgby5zY2hlbWUgPSBkZWZhdWx0X3NjaGVtZSB8fCAnJztcclxuICAgIG8ubmV0bG9jID0gJyc7XHJcbiAgICBvLmhvc3RuYW1lID0gJyc7XHJcbiAgICBsZWZ0b3ZlciA9IHVybDtcclxuICB9XHJcbiAgby5zY2hlbWUgPSBvLnNjaGVtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICBwYXJ0cyA9IGxlZnRvdmVyLm1hdGNoKHBhcnNlX2xlZnRvdmVycyk7XHJcblxyXG4gIG8ucGF0aCA9IHBhcnRzWzFdIHx8ICcnO1xyXG4gIG8ucXVlcnkgPSBwYXJ0c1syXSB8fCAnJztcclxuXHJcbiAgaWYgKGFsbG93X2ZyYWdtZW50cykge1xyXG4gICAgby5mcmFnbWVudCA9IHBhcnRzWzNdIHx8ICcnO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBvLmZyYWdtZW50ID0gJyc7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbztcclxufTtcclxuXHJcbnVybHBhcnNlLnVybHVuc3BsaXQgPSBmdW5jdGlvbiAobykge1xyXG4gIHZhciBzID0gJyc7XHJcbiAgaWYgKG8uc2NoZW1lKSB7XHJcbiAgICBzICs9IG8uc2NoZW1lICsgJzovLyc7XHJcbiAgfVxyXG5cclxuICBpZiAoby5uZXRsb2MpIHtcclxuICAgIGlmIChzID09PSAnJykge1xyXG4gICAgICBzICs9ICcvLyc7XHJcbiAgICB9XHJcbiAgICBzICs9IG8ubmV0bG9jO1xyXG4gIH0gZWxzZSBpZiAoby5ob3N0bmFtZSkge1xyXG4gICAgLy8gZXh0ZW5zaW9uLiAgUHl0aG9uIG9ubHkgdXNlcyBuZXRsb2NcclxuICAgIGlmIChzID09PSAnJykge1xyXG4gICAgICBzICs9ICcvLyc7XHJcbiAgICB9XHJcbiAgICBzICs9IG8uaG9zdG5hbWU7XHJcbiAgICBpZiAoby5wb3J0KSB7XHJcbiAgICAgIHMgKz0gJzonICsgby5wb3J0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKG8ucGF0aCkge1xyXG4gICAgcyArPSBvLnBhdGg7XHJcbiAgfVxyXG5cclxuICBpZiAoby5xdWVyeSkge1xyXG4gICAgcyArPSAnPycgKyBvLnF1ZXJ5O1xyXG4gIH1cclxuICBpZiAoby5mcmFnbWVudCkge1xyXG4gICAgcyArPSAnIycgKyBvLmZyYWdtZW50O1xyXG4gIH1cclxuICByZXR1cm4gcztcclxufTtcclxuXHJcbnVybHBhcnNlLnVybGpvaW4gPSBmdW5jdGlvbiAoYmFzZSwgdXJsLCBhbGxvd19mcmFnbWVudHMpIHtcclxuICBpZiAodHlwZW9mIGFsbG93X2ZyYWdtZW50cyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIGFsbG93X2ZyYWdtZW50cyA9IHRydWU7XHJcbiAgfVxyXG5cclxuICB2YXIgdXJsX3BhcnRzID0gdXJscGFyc2UudXJsc3BsaXQodXJsKTtcclxuXHJcbiAgLy8gaWYgdXJsIHBhcnRzIGhhcyBhIHNjaGVtZSAoaS5lLiBhYnNvbHV0ZSlcclxuICAvLyB0aGVuIG5vdGhpbmcgdG8gZG9cclxuICBpZiAodXJsX3BhcnRzLnNjaGVtZSkge1xyXG4gICAgaWYgKCFhbGxvd19mcmFnbWVudHMpIHtcclxuICAgICAgcmV0dXJuIHVybDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB1cmxwYXJzZS51cmxkZWZyYWcodXJsKVswXTtcclxuICAgIH1cclxuICB9XHJcbiAgdmFyIGJhc2VfcGFydHMgPSB1cmxwYXJzZS51cmxzcGxpdChiYXNlKTtcclxuXHJcbiAgLy8gY29weSBiYXNlLCBvbmx5IGlmIG5vdCBwcmVzZW50XHJcbiAgaWYgKCFiYXNlX3BhcnRzLnNjaGVtZSkge1xyXG4gICAgYmFzZV9wYXJ0cy5zY2hlbWUgPSB1cmxfcGFydHMuc2NoZW1lO1xyXG4gIH1cclxuXHJcbiAgLy8gY29weSBuZXRsb2MsIG9ubHkgaWYgbm90IHByZXNlbnRcclxuICBpZiAoIWJhc2VfcGFydHMubmV0bG9jIHx8ICFiYXNlX3BhcnRzLmhvc3RuYW1lKSB7XHJcbiAgICBiYXNlX3BhcnRzLm5ldGxvYyA9IHVybF9wYXJ0cy5uZXRsb2M7XHJcbiAgICBiYXNlX3BhcnRzLmhvc3RuYW1lID0gdXJsX3BhcnRzLmhvc3RuYW1lO1xyXG4gICAgYmFzZV9wYXJ0cy5wb3J0ID0gdXJsX3BhcnRzLnBvcnQ7XHJcbiAgfVxyXG5cclxuICAvLyBwYXRoc1xyXG4gIGlmICh1cmxfcGFydHMucGF0aC5sZW5ndGggPiAwKSB7XHJcbiAgICBpZiAodXJsX3BhcnRzLnBhdGguY2hhckF0KDApID09ICcvJykge1xyXG4gICAgICBiYXNlX3BhcnRzLnBhdGggPSB1cmxfcGFydHMucGF0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHJlbGF0aXZlIHBhdGguLiBnZXQgcmlkIG9mIFwiY3VycmVudCBmaWxlbmFtZVwiIGFuZFxyXG4gICAgICAvLyAgIHJlcGxhY2UuICBTYW1lIGFzIHZhciBwYXJ0cyA9XHJcbiAgICAgIC8vICAgYmFzZV9wYXJ0cy5wYXRoLnNwbGl0KCcvJyk7IHBhcnRzW3BhcnRzLmxlbmd0aC0xXSA9XHJcbiAgICAgIC8vICAgdXJsX3BhcnRzLnBhdGg7IGJhc2VfcGFydHMucGF0aCA9IHBhcnRzLmpvaW4oJy8nKTtcclxuICAgICAgdmFyIGlkeCA9IGJhc2VfcGFydHMucGF0aC5sYXN0SW5kZXhPZignLycpO1xyXG4gICAgICBpZiAoaWR4ID09IC0xKSB7XHJcbiAgICAgICAgYmFzZV9wYXJ0cy5wYXRoID0gdXJsX3BhcnRzLnBhdGg7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYmFzZV9wYXJ0cy5wYXRoID0gYmFzZV9wYXJ0cy5wYXRoLnN1YnN0cigwLCBpZHgpICsgJy8nICtcclxuICAgICAgICAgIHVybF9wYXJ0cy5wYXRoO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBjbGVhbiB1cCBwYXRoXHJcbiAgYmFzZV9wYXJ0cy5wYXRoID0gdXJscGFyc2Uubm9ybWFsaXplcGF0aChiYXNlX3BhcnRzLnBhdGgpO1xyXG5cclxuICAvLyBjb3B5IHF1ZXJ5IHN0cmluZ1xyXG4gIGJhc2VfcGFydHMucXVlcnkgPSB1cmxfcGFydHMucXVlcnk7XHJcblxyXG4gIC8vIGNvcHkgZnJhZ21lbnRzXHJcbiAgaWYgKGFsbG93X2ZyYWdtZW50cykge1xyXG4gICAgYmFzZV9wYXJ0cy5mcmFnbWVudCA9IHVybF9wYXJ0cy5mcmFnbWVudDtcclxuICB9IGVsc2Uge1xyXG4gICAgYmFzZV9wYXJ0cy5mcmFnbWVudCA9ICcnO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHVybHBhcnNlLnVybHVuc3BsaXQoYmFzZV9wYXJ0cyk7XHJcbn07XHJcblxucmV0dXJuIHVybHBhcnNlO1xufSkpO1xuIl19
