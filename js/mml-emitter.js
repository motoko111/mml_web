// https://github.com/mohayonao/mml-emitter
// 一部改変
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MMLEmitter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./lib").default;

},{"./lib":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _seqEmitter = require("seq-emitter");

var _seqEmitter2 = _interopRequireDefault(_seqEmitter);

var _mmlIterator = require("mml-iterator");

var _mmlIterator2 = _interopRequireDefault(_mmlIterator);

var _reverseOctave = require("./reverseOctave");

var _reverseOctave2 = _interopRequireDefault(_reverseOctave);

var _stripComments = require("strip-comments");

var _stripComments2 = _interopRequireDefault(_stripComments);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MMLEmitter = (function (_SeqEmitter) {
  _inherits(MMLEmitter, _SeqEmitter);

  function MMLEmitter(source) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, MMLEmitter);

    if (config.reverseOctave) {
      source = (0, _reverseOctave2.default)(source);
    }

    var MMLIteratorClass = config.MMLIterator || _mmlIterator2.default;

    var tracks = (0, _stripComments2.default)(source).split(";");

    tracks = tracks.filter(function (source) {
      return !!source.trim();
    });
    tracks = tracks.map(function (track) {
      return new MMLIteratorClass(track, config);
    });

    return _possibleConstructorReturn(this, Object.getPrototypeOf(MMLEmitter).call(this, tracks, config));
  }

  return MMLEmitter;
})(_seqEmitter2.default);

exports.default = MMLEmitter;
},{"./reverseOctave":4,"mml-iterator":17,"seq-emitter":28,"strip-comments":33}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _MMLEmitter = require("./MMLEmitter");

var _MMLEmitter2 = _interopRequireDefault(_MMLEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _MMLEmitter2.default;
},{"./MMLEmitter":2}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = reverseOctave;
function reverseOctave(source) {
  return source.replace(/[<>]/g, function (str) {
    return str === "<" ? ">" : "<";
  });
}
},{}],5:[function(require,module,exports){
/*!
 * cr <https://github.com/jonschlinkert/cr>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function(str) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  return str.replace(/\r\n|\r/g, '\n');
};

module.exports.strip = function(str) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  return str.split('\r').join('');
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
'use strict';

var isObject = require('is-extendable');

module.exports = function extend(o/*, objects*/) {
  if (!isObject(o)) { o = {}; }

  var len = arguments.length;
  for (var i = 1; i < len; i++) {
    var obj = arguments[i];

    if (isObject(obj)) {
      assign(o, obj);
    }
  }
  return o;
};

function assign(a, b) {
  for (var key in b) {
    if (hasOwn(b, key)) {
      a[key] = b[key];
    }
  }
}

/**
 * Returns true if the given `key` is an own property of `obj`.
 */

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

},{"is-extendable":16}],8:[function(require,module,exports){
'use strict';

var extend = require('extend-shallow');
var Block = require('./lib/block');
var Line = require('./lib/line');
var utils = require('./lib/utils');

/**
 * Extract comments from the given `string`.
 *
 * ```js
 * extract(str, options);
 * ```
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

function comments(str, options, fn) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  return block(str, options, fn)
    .concat(line(str, options, fn))
    .sort(compare);
}

/**
 * Extract block comments from the given `string`.
 *
 * ```js
 * extract.block(str, options);
 * ```
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

function block(str, options, fn) {
  return factory('/*', '*/', Block)(str, options, fn);
}

/**
 * Extract line comments from the given `string`.
 *
 * ```js
 * extract.line(str, options);
 * ```
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

function line(str, options, fn) {
  return factory('//', '\n', Line)(str, options, fn);
}

/**
 * Factory for extracting comments from a string.
 *
 * @param {String} `string`
 * @return {String}
 */

function factory(open, close, Ctor) {
  return function(str, options, fn) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (typeof fn !== 'function') {
      fn = utils.identity;
    }

    var opts = extend({}, options);
    str = utils.normalize(str);
    str = utils.escapeQuoted(str);

    var res = [];
    var start = str.indexOf(open);
    var end = str.indexOf(close, start);
    var len = str.length;
    if (end === -1) {
      end = len;
    }

    while (start !== -1 && end <= len) {
      var comment = fn(new Ctor(str, start, end, open, close));
      res.push(comment);
      if (opts.first && res.length === 1) {
        return res;
      }
      start = str.indexOf(open, end + 1);
      end = str.indexOf(close, start);
      if (end === -1) {
        end = len;
      }
    }
    return res;
  };
}

/**
 * Extract the first comment from the given `string`.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

function first(str) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  var arr = comments(str, {first: true});
  if (arr && arr.length) {
    return arr[0].raw;
  } else {
    return null;
  }
}

/**
 * Utility for sorting line and block comments into
 * the correct order.
 */

function compare(a, b) {
  return a.loc.start.pos - b.loc.start.pos;
}

/**
 * Expose `extract` module
 */

module.exports = comments;

/**
 * Expose `extract.first` method
 */

module.exports.first = first;

/**
 * Expose `extract.block` method
 */

module.exports.block = block;

/**
 * Expose `extract.line` method
 */

module.exports.line = line;

/**
 * Expose `extract.factory` method
 */

module.exports.factory = factory;

},{"./lib/block":9,"./lib/line":11,"./lib/utils":12,"extend-shallow":7}],9:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var Code = require('./code');

/**
 * Create a new BlockComment with:
 *   - `str` the entire string
 *   - `idx` the starting index of the comment
 *   - `end` the ending index of the comment
 *   - `open` the opening character(s) of the comment
 *   - `close` the closing character(s) of the comment
 */

function BlockComment(str, idx, end, open, close) {
  var ol = open.length;
  var cl = close.length;

  var lineno = utils.linesCount(str, idx);
  var value = utils.restore(str.slice(idx, end + cl));
  var inner = value.slice(ol, -cl);
  var lines = utils.strip(inner.split('\n'));

  this.type = 'block';
  this.raw = value;
  this.value = lines.join('\n');
  this.lines = lines;

  this.loc = {
    start: {
      line: lineno,
      pos: idx
    },
    end: {
      line: lineno + utils.linesCount(value) - 1,
      pos: end + cl
    }
  };

  /**
   * Add code context
   */

  this.code = new Code(str, this);
}

/**
 * expose `BlockComment`
 */

module.exports = BlockComment;

},{"./code":10,"./utils":12}],10:[function(require,module,exports){
'use strict';

var codeContext = require('parse-code-context');
var utils = require('./utils');

function Code(str, comment) {
  str = utils.restore(str);
  var start = comment.loc.end.pos;
  var lineno = comment.loc.end.line;
  var ctx = {};

  var lines = str.split('\n').slice(lineno);
  for (var i = 0; i < lines.length; i++) {
    var res = codeContext(lines[i], lineno + i);
    if (res) {
      ctx = res;
      lineno += i;
      break;
    }
  }

  var val = ctx.original || '';
  var pos = str.slice(start).indexOf(val) + start;

  return {
    context: ctx,
    line: lineno,
    loc: {
      start: { line: lineno, pos: pos },
      end: { line: lineno, pos: pos + val.length }
    },
    value: val.trim()
  };
}

/**
 * Expose `Code`
 */

module.exports = Code;

},{"./utils":12,"parse-code-context":26}],11:[function(require,module,exports){
'use strict';

var utils = require('./utils');

/**
 * Create a new LineComment with:
 *   - `str` the entire string
 *   - `idx` the starting index of the comment
 *   - `end` the ending index of the comment
 *   - `open` the opening character(s) of the comment (e.g. '//')
 *   - `close` the closing character(s) of the comment (e.g. '\n')
 */

function LineComment(str, idx, end, open, close) {
  var lineno = utils.linesCount(str, idx);
  var value = utils.restore(str.slice(idx, end));

  this.type = 'line';
  this.raw = value;
  this.value = this.raw.replace(/^\s*[\/\s]+/, '');

  this.loc = {
    start: {
      line: lineno,
      pos: idx
    },
    end: {
      line: lineno + utils.linesCount(value) - 1,
      pos: end
    }
  };
}

/**
 * expose `LineComment`
 */

module.exports = LineComment;

},{"./utils":12}],12:[function(require,module,exports){
'use strict';

var cr = require('cr');
var bom = require('strip-bom-string');
var quotesRegex = require('quoted-string-regex');
var nonchar = require('noncharacters');

/**
 * Expose `utils`
 */

var utils = module.exports;

/**
 * Normalize newlines, strip carriage returns and
 * byte order marks from `str`
 */

utils.normalize = function(str) {
  return cr(bom(str));
};

/**
 * Return the given value unchanged
 */

utils.identity = function(val) {
  return val;
};

/**
 * Get the total number of lines from the start
 * of a string to the given index.
 */

utils.linesCount = function(str, i) {
  if (typeof i === 'number') {
    return str.slice(0, i).split('\n').length;
  }
  return str.split('\n').length;
};

/**
 * Utility for getting a sequence of non-characters. The
 * goal is to return a non-character string that is the
 * same length as the characters we're replacing.
 *
 * http://www.unicode.org/faq/private_use.html#noncharacters
 */

function ch(num) {
  return nonchar[num] + nonchar[num];
}

/**
 * Escaped comment characters in quoted strings
 *
 * @param {String} str
 * @return {String}
 */

utils.escapeQuoted = function(str) {
  return str.replace(quotesRegex(), function(val) {
    val = val.split('//').join(ch(0));
    val = val.split('/*').join(ch(1));
    val = val.split('*/').join(ch(2));
    return val;
  });
};

/**
 * Restore comment characters in quoted strings
 *
 * @param {String} str
 * @return {String}
 */

utils.restore = function(str) {
  return str.replace(quotesRegex(), function(val) {
    val = val.split(ch(0)).join('//');
    val = val.split(ch(1)).join('/*');
    val = val.split(ch(2)).join('*/');
    return val;
  });
};

/**
 * Strip stars from the beginning of each comment line,
 * and strip whitespace from the end of each line. We
 * can't strip whitespace from the beginning since comments
 * use markdown or other whitespace-sensitive formatting.
 *
 * @param {Array} `lines`
 * @return {Array}
 */

utils.strip = function(lines) {
  var len = lines.length, i = -1;
  var res = [];

  while (++i < len) {
    var line = lines[i].replace(/^\s*[*\/]+\s?|\s+$/g, '');
    if (!line) continue;
    res.push(line);
  }
  return res;
};

},{"cr":5,"noncharacters":24,"quoted-string-regex":27,"strip-bom-string":32}],13:[function(require,module,exports){
module.exports = require("./lib");

},{"./lib":15}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ITERATOR = typeof Symbol !== "undefined" ? Symbol.iterator : "Symbol(Symbol.iterator)";

var IntervalIterator = (function () {
  function IntervalIterator(iter, interval) {
    _classCallCheck(this, IntervalIterator);

    this._iter = iter;
    this._interval = +interval;
    this._currentTime = 0;
    this._iterItem = null;
    this._done = false;
  }

  _createClass(IntervalIterator, [{
    key: "next",
    value: function next() {
      var t0 = this._currentTime + this._interval;

      if (this._done) {
        return { done: true, value: [] };
      }

      var result = [];
      var iterItem = undefined;

      while ((iterItem = this._next(t0)) !== null) {
        result.push(iterItem);
      }

      this._currentTime = t0;

      return { done: false, value: result };
    }
  }, {
    key: ITERATOR,
    value: function value() {
      return this;
    }
  }, {
    key: "_next",
    value: function _next(t0) {
      if (this._iterItem) {
        return this._nextIterItem(t0);
      }

      var iterItem = this._iter.next();

      if (!iterItem.done) {
        this._iterItem = iterItem.value;

        return this._nextIterItem(t0);
      }

      this._done = true;

      return null;
    }
  }, {
    key: "_nextIterItem",
    value: function _nextIterItem(t0) {
      
      if (t0 <= this._iterItem.time) {
        return null;
      }

      var iterItem = this._iterItem;

      this._iterItem = null;

      return iterItem;
    }
  }]);

  return IntervalIterator;
})();

exports["default"] = IntervalIterator;
module.exports = exports["default"];
},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _IntervalIterator = require("./IntervalIterator");

var _IntervalIterator2 = _interopRequireDefault(_IntervalIterator);

exports["default"] = _IntervalIterator2["default"];
module.exports = exports["default"];
},{"./IntervalIterator":14}],16:[function(require,module,exports){
/*!
 * is-extendable <https://github.com/jonschlinkert/is-extendable>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function isExtendable(val) {
  return typeof val !== 'undefined' && val !== null
    && (typeof val === 'object' || typeof val === 'function');
};

},{}],17:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./lib":23,"dup":13}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = {
  tempo: 120,
  tone: 0,
  key:0,
  octave: 4,
  length: 4,
  velocity: 100,
  quantize: 75,
  loopCount: 2,
  envelope: [0,0.1,1,0.5],
  baseTone: null,
  command: [[{command:"v",value:[0,0]}]],
  wave: null,
  pitch: null,
  volume: [15],
  durty: null,
  detune: 0,
  pan: 0,
  slur: null,
  mute: false,
};
module.exports = exports["default"];
},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Syntax = require("./Syntax");

var _Syntax2 = _interopRequireDefault(_Syntax);

var _DefaultParams = require("./DefaultParams");

var _DefaultParams2 = _interopRequireDefault(_DefaultParams);

var _MMLParser = require("./MMLParser");

var _MMLParser2 = _interopRequireDefault(_MMLParser);

var ITERATOR = typeof Symbol !== "undefined" ? Symbol.iterator : "Symbol(Symbol.iterator)";

var MMLIterator = (function () {
  function MMLIterator(source) {
    _classCallCheck(this, MMLIterator);

    source = this.parseVariable(source);
    //console.log(source);

    this.source = source;
    this._commands = new _MMLParser2["default"](source).parse();
    this._commandIndex = 0;
    this._processedTime = 0;
    this._currentLength = 0;
    this._iterator = null;
    this._octave = _DefaultParams2["default"].octave;
    this._noteLength = [_DefaultParams2["default"].length];
    this._velocity = _DefaultParams2["default"].velocity;
    this._quantize = _DefaultParams2["default"].quantize;
    this._tempo = _DefaultParams2["default"].tempo;
    this._tone = _DefaultParams2["default"].tone;
    this._key = _DefaultParams2["default"].key;
    this._envelope = _DefaultParams2["default"].envelope;
    this._baseTone = _DefaultParams2["default"].baseTone;
    this._command = JSON.parse(JSON.stringify(_DefaultParams2["default"].command));
    this._mute = _DefaultParams2["default"].mute;
    this._wave = _DefaultParams2["default"].wave;
    this._pitch = _DefaultParams2["default"].pitch;
    this._volume = _DefaultParams2["default"].volume;
    this._durty = _DefaultParams2["default"].durty;
    this._detune = _DefaultParams2["default"].detune;
    this._pan = _DefaultParams2["default"].pan;
    this._slur = _DefaultParams2["default"].slur;
    this._infiniteLoopIndex = -1;
    this._loopStack = [];
    this._done = false;
    this._lastNoteLength = 0;
  }

  _createClass(MMLIterator, [{
    key: "hasNext",
    value: function hasNext() {
      return this._commandIndex < this._commands.length;
    }
  }, {
    key: "next",
    value: function next() {
      if (this._done) {
        return { done: true, value: null };
      }

      if (this._iterator) {
        var iterItem = this._iterator.next();

        if (!iterItem.done) {
          return iterItem;
        }
      }

      var command = this._forward(true);

      if (isNoteEvent(command)) {
        this._iterator = this[command.type](command);
      } else {
        this._done = true;
        return { done: false, value: { type: "end", time: this._processedTime } };
      }

      return this.next();
    }
  }, {
    key: ITERATOR,
    value: function value() {
      return this;
    }
  }, {
    key: "_forward",
    value: function _forward(forward) {
      while (this.hasNext() && !isNoteEvent(this._commands[this._commandIndex])) {
        var command = this._commands[this._commandIndex++];

        this[command.type](command);
      }

      if (forward && !this.hasNext() && this._infiniteLoopIndex !== -1) {
        this._commandIndex = this._infiniteLoopIndex;

        return this._forward(false);
      }

      return this._commands[this._commandIndex++] || {};
    }
  }, {
    key: "_calcDuration",
    value: function _calcDuration(noteLength) {
      var _this = this;

      if (noteLength[0] === null) {
        noteLength = this._noteLength.concat(noteLength.slice(1));
      }

      var prev = null;
      var dotted = 0;
      let calcLength = 0;

      //console.log("noteLength:" + noteLength);
      noteLength = noteLength.map(function (elem) {
        switch (elem) {
          case null:
            //console.log("elem = prev:" + elem + " " + prev);
            elem = prev;
            break;
          case 0:
            //console.log("elem = dotted *= 2:" + elem + " " + dotted);
            elem = dotted *= 2;
            break;
          default:
            //console.log("prev = dotted:" + prev + " " + dotted);
            prev = dotted = elem;
            break;
        }

        var length = elem !== null ? elem : _DefaultParams2["default"].length;
        calcLength += Math.ceil(128 / length); // 128部音符が何個あるか
        //console.log("_calcDuration noteLength :" + length);
        return 60 / _this._tempo * (4 / length);
      });

      let dt = noteLength.reduce(function (a, b) {
        return a + b;
      }, 0);

      _this._lastNoteLength = calcLength;

      return dt;
    }
  }, {
    key: "_calcNoteNumber",
    value: function _calcNoteNumber(noteNumber) {
      return noteNumber + this._octave * 12 + 12;
    }
  },
  // =================== 追加 ===================
  {
    key: "none",
    value: function _none() {
      return ;
    }
  },
  {
    key: "parseVariable_old",
    value: function parseVariable_old (src, refVariables) {
      if(refVariables === undefined) refVariables = {}
      const targetRegex = new RegExp(/(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*.*(\r|\n)+/, 'g');
      const nameStartRegex = new RegExp(/^(var[\s]+)?/, 'g');
      const nameEqualLeftRegex = new RegExp(/^(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/, 'g');
      const nameEqualDeleteRegex = new RegExp(/[\s]*=[\s]*/, 'g');
      const startRegex = new RegExp(/^(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/, 'g');
      const endRegex = new RegExp(/(\r|\n)+/, 'g');
      let match;
      let num = 0;
      let execStr = src;
      while ((match = targetRegex.exec(execStr)) !== null) {
        let str = match[0];
        let name = str.match(nameEqualLeftRegex)[0].replace(nameEqualDeleteRegex,"").replace(nameStartRegex, "");
        let value = str.replace(startRegex, "").replace(endRegex, "");
        refVariables[name] = {value:value, repStr:"@@@@@{" + num + "}@@@@@", index:match.index};
        num++;
        src = src.replace(str, "");
      }
      if(num > 0){
        // 変数を置換
        Object.keys(refVariables).map(key => {
          src = src.replaceAll(key, refVariables[key].repStr);
        });
        Object.keys(refVariables).map(key => {
          src = src.replaceAll(refVariables[key].repStr, refVariables[key].value);
        });
      }
      return src;
    }
  },
  {
    key: "parseVariable",
    value: function parseVariable (src, refVariables) {
      if(refVariables === undefined) refVariables = {}

      const targetRegex = new RegExp(/(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*.*/, 'g');
      const nameStartRegex = new RegExp(/^(var[\s]+)?/, 'g');
      const nameEqualLeftRegex = new RegExp(/^(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/, 'g');
      const nameEqualDeleteRegex = new RegExp(/[\s]*=[\s]*/, 'g');
      const startRegex = new RegExp(/^(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/, 'g');
      const endRegex = new RegExp(/(\r|\n)+/, 'g');

      let replaceValueInValue = function(index, str){
        // 変数内変数がある場合は置換
        Object.keys(refVariables).map(key => {
          let end = refVariables[key].endLineIndex;
          if(index >= end){
            str = str.replaceAll(refVariables[key].repStr, refVariables[key].value);
            lines[index] = str;
          }
        });
        return str;
      }

      const lines = src.split(/\r\n|\n/);
      let num = 0;
      for(let i = 0; i < lines.length; ++i){
        let line = lines[i];
        let matches = line.match(targetRegex);
        if(matches){
          matches.forEach((match) => {
            let startIndex = i;

            match = replaceValueInValue(i, match);

            let name = match.match(nameEqualLeftRegex)[0].replace(nameEqualDeleteRegex,"").replace(nameStartRegex, "");
            let value = match.replace(startRegex, "");

            let hierarchy = 0;
            let valueStr = "";
            let read = (val) => {
              for (let iStr = 0; iStr < val.length; iStr++) 
              {
                let s = val[iStr];
                if(s === '{'){
                  hierarchy ++;
                  if(hierarchy === 1) continue;
                } else if (s === '}'){
                  hierarchy --;
                  if(hierarchy === 0) continue;
                }
                valueStr+=s;
              }
            }
            while(true){
              read(value);
              if(hierarchy === 0){
                break;
              }
              if(lines.length >= i + 1) break;
              i++;
              value = lines[i];
              value = replaceValueInValue(i, value);
            }

            refVariables[name] = {value:valueStr, repStr:"${" + name + "}", startLineIndex:startIndex, endLineIndex:i};

            let start = refVariables[name].startLineIndex;
            let end = refVariables[name].endLineIndex;
            for(let j = start ; j <= end; ++j){
              lines[j] = "";
              // console.log("delete line:" + j);
            }
            num++;
          });
        }
      }
      if(num > 0){
        Object.keys(refVariables).map(key => {
          let end = refVariables[key].endLineIndex;
          for(let i = end; i < lines.length; ++i){
            lines[i] = lines[i].replaceAll(key, refVariables[key].value);
          }
        });
        let str = "";
        for(let i = 0; i < lines.length; ++i){
          str += lines[i];
          if(i != lines.length - 1)  str += "\r\n";
        }
        return str;
      }
      return src;
    }
  },
  // ======================================
   {
    key: _Syntax2["default"].Note,
    value: function value(command) {
      let _this2 = this;

      let type = "note";
      let time = this._processedTime;
      let textIndex = command.textIndex;
      let duration = this._calcDuration(command.noteLength);
      let noteNumbers = command.noteNumbers.map(function (noteNumber) {
        return _this2._calcNoteNumber(noteNumber);
      });
      let quantize = this._quantize;
      let velocity = this._velocity;
      let tone = this._tone;
      let key = this._key;
      let tempo = this._tempo;
      let length128 = this._lastNoteLength; // 追加
      let length = this._lastNoteLength / 128 * 4; // 4/4のときの長さ
      let envelope = this._envelope;
      let baseTone = this._baseTone;
      let cmd = this._command;
      let mute = this._mute;
      let wave = this._wave;
      let pitch = this._pitch;
      let volume = this._volume;
      let durty = this._durty;
      let detune = this._detune;
      let pan = this._pan;
      let currentLength = this._currentLength;
      this._wave = null;
      this._command = null;

      this._processedTime = this._processedTime + duration;
      this._currentLength = this._currentLength + length128; // 少数を使わないように128分音符を基準の長さにする

      let slur = []
      let slurDuration = 0;
      // 次の情報を見て次がスラーだったらスラー用のデータを作る
      for(; this.hasNext();){
        let c = this._forward(true);
        if(!this._slur){
          this._commandIndex--;
          break;
        }
        this._slur = null;
        let len = this._calcDuration(c.noteLength);
        let length128_2 = this._lastNoteLength;
				1 != c.noteNumbers.length && console.log("Slur Error");
				let noteNumber_2 = this._calcNoteNumber(c.noteNumbers[0]);
        //console.log(noteNumber_2);
        slur.push({
          time: this._processedTime,
					duration: len,
					noteNumber: noteNumber_2
        });
        slurDuration += len;
        this._processedTime = this._processedTime + len;
        this._currentLength = this._currentLength + length128_2; // 少数を使わないように128分音符を基準の長さにする
      }
      
      return arrayToIterator(noteNumbers.map(function (noteNumber) {
        return { type: type,
          time: time,
          duration: duration,
          noteNumber: noteNumber,
          tempo: tempo,
          velocity: velocity,
          quantize: quantize,
          tone: tone,
          length:length,
          currentLength:currentLength,
          envelope:envelope,
          baseTone:baseTone,
          detune:detune,
          chord:noteNumbers.length > 1,
          commands:cmd,
          mute:mute,
          pitch:pitch,
          volume:volume,
          durty:durty,
          pan:pan,
          wave:wave,
          slur:slur,
          slurDuration:slurDuration,
          key:key,
          textIndex:textIndex,
          };
      }));
    }
  }, {
    key: _Syntax2["default"].Rest,
    value: function value(command) {
      let duration = this._calcDuration(command.noteLength);

      this._processedTime = this._processedTime + duration;
      this._currentLength = this._currentLength + this._lastNoteLength; // 少数を使わないように128分音符を基準の長さにする
    }
  }, {
    key: _Syntax2["default"].Octave,
    value: function value(command) {
      this._octave = command.value !== null ? command.value : _DefaultParams2["default"].octave;
    }
  }, {
    key: _Syntax2["default"].OctaveShift,
    value: function value(command) {
      let value = command.value !== null ? command.value : 1;

      this._octave += value * command.direction;
    }
  }, {
    key: _Syntax2["default"].NoteLength,
    value: function value(command) {
      let noteLength = command.noteLength.map(function (value) {
        return value !== null ? value : _DefaultParams2["default"].length;
      });

      this._noteLength = noteLength;
    }
  }, {
    key: _Syntax2["default"].NoteVelocity,
    value: function value(command) {
      this._velocity = command.value !== null ? command.value : _DefaultParams2["default"].velocity;
    }
  }, {
    key: _Syntax2["default"].NoteQuantize,
    value: function value(command) {
      this._quantize = command.value !== null ? command.value : _DefaultParams2["default"].quantize;
    }
  }, {
    key: _Syntax2["default"].Tempo,
    value: function value(command) {
      this._tempo = command.value !== null ? command.value : _DefaultParams2["default"].tempo;
    }
  },
  // =================== 追加 ===================
   {
    key: _Syntax2["default"].Tone,
    value: function value(command) {
      this._tone = command.value !== null ? command.value : _DefaultParams2["default"].tone;
    }
  },
  {
    key: _Syntax2["default"].Envelope,
    value: function value(command) {
      this._envelope = command.value !== null ? command.value : _DefaultParams2["default"].envelope;
    }
  },
  {
    key: _Syntax2["default"].BaseTone,
    value: function value(command) {
      this._baseTone = command.value !== null ? command.value : _DefaultParams2["default"].baseTone;
    }
  },
  {
    key: _Syntax2["default"].Detune,
    value: function value(command) {
      this._detune = command.value !== null ? command.value : _DefaultParams2["default"].detune;
    }
  },
  {
    key: _Syntax2["default"].Pan,
    value: function value(command) {
      this._pan = command.value !== null ? command.value : _DefaultParams2["default"].pan;
    }
  },
  {
    key: _Syntax2["default"].Command,
    value: function value(command) {
      if(!this._command) this._command = [];
      if(command.value !== null){
        this._command.push({
          command:command.command,
          value:command.value
        });
      }
      // this._command = command.value !== null ? command.value : _DefaultParams2["default"].command;
    }
  },
  {
    key: _Syntax2["default"].Mute,
    value: function value(command) {
      this._mute = command.value !== null ? command.value : _DefaultParams2["default"].mute;
    }
  },
  {
    key: _Syntax2["default"].Wave,
    value: function value(command) {
      this._wave = command.value !== null ? command.value : _DefaultParams2["default"].wave;
    }
  },
  {
    key: _Syntax2["default"].Pitch,
    value: function value(command) {
      this._pitch = command.value !== null ? command.value : _DefaultParams2["default"].pitch;
    }
  },
  {
    key: _Syntax2["default"].Volume,
    value: function value(command) {
      this._volume = command.value !== null ? command.value : _DefaultParams2["default"].volume;
    }
  },
  {
    key: _Syntax2["default"].Durty,
    value: function value(command) {
      this._durty = command.value !== null ? command.value : _DefaultParams2["default"].durty;
    }
  },
  {
    key: _Syntax2["default"].Slur,
    value: function value(command) {
      this._slur = command.value !== null ? command.value : _DefaultParams2["default"].slur;
    }
  },
  {
    key: _Syntax2["default"].Key,
    value: function value(command) {
      this._key = command.value !== null ? command.value : _DefaultParams2["default"].key;
    }
  },
  // ======================================
   {
    key: _Syntax2["default"].InfiniteLoop,
    value: function value() {
      this._infiniteLoopIndex = this._commandIndex;
    }
  }, {
    key: _Syntax2["default"].LoopBegin,
    value: function value(command) {
      let loopCount = command.value !== null ? command.value : _DefaultParams2["default"].loopCount;
      let loopTopIndex = this._commandIndex;
      let loopOutIndex = -1;

      this._loopStack.push({ loopCount: loopCount, loopTopIndex: loopTopIndex, loopOutIndex: loopOutIndex });
    }
  }, {
    key: _Syntax2["default"].LoopExit,
    value: function value() {
      let looper = this._loopStack[this._loopStack.length - 1];
      let index = this._commandIndex;

      if (looper.loopCount <= 1 && looper.loopOutIndex !== -1) {
        index = looper.loopOutIndex;
      }

      this._commandIndex = index;
    }
  }, {
    key: _Syntax2["default"].LoopEnd,
    value: function value() {
      let looper = this._loopStack[this._loopStack.length - 1];
      let index = this._commandIndex;

      if (looper.loopOutIndex === -1) {
        looper.loopOutIndex = this._commandIndex;
      }
      looper.loopCount -= 1;

      if (0 < looper.loopCount) {
        index = looper.loopTopIndex;
      } else {
        this._loopStack.pop();
      }

      this._commandIndex = index;
    }
  }]);

  return MMLIterator;
})();

exports["default"] = MMLIterator;

function arrayToIterator(array) {
  let index = 0;

  return {
    next: function next() {
      if (index < array.length) {
        return { done: false, value: array[index++] };
      }
      return { done: true };
    }
  };
}

function isNoteEvent(command) {
  return command.type === _Syntax2["default"].Note || command.type === _Syntax2["default"].Rest;
}
module.exports = exports["default"];
},{"./DefaultParams":18,"./MMLParser":20,"./Syntax":22}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Syntax = require("./Syntax");

var _Syntax2 = _interopRequireDefault(_Syntax);

var _Scanner = require("./Scanner");

var _Scanner2 = _interopRequireDefault(_Scanner);

var NOTE_INDEXES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

var MMLParser = (function () {
  function MMLParser(source) {
    _classCallCheck(this, MMLParser);
    
    this.scanner = new _Scanner2["default"](source);
  }

  _createClass(MMLParser, [{
    key: "parse",
    value: function parse() {
      var _this = this;

      var result = [];

      this._readUntil(";", function () {
        result = result.concat(_this.advance());
      });

      return result;
    }
  }, {
    key: "advance",
    value: function advance() {
      switch (this.scanner.peek()) {
        case "c":
        case "d":
        case "e":
        case "f":
        case "g":
        case "a":
        case "b":
          return this.readNote();
        case "[":
          return this.readChord();
        case "r":
          return this.readRest();
        case "o":
          return this.readOctave();
        case ">":
          return this.readOctaveShift(+1);
        case "<":
          return this.readOctaveShift(-1);
        case "l":
          return this.readNoteLength();
        case "q":
          return this.readNoteQuantize();
        case "v":
          return this.readNoteVelocity();
        case "D":
          return this.readDetune();
        case "P":
          return this.readPan();
        case "t":
          return this.readTempo();
        case "k":
          return this.readKey();
        case "$":
          return this.readInfiniteLoop();
        case "/":
          return this.readLoop();
        case '@':
          return this.readTone();
        case '&':
          return this.readSlur();
        case '|':
          return this.readNone();
        case '=':
          return this.readVariable();
        default:
        // do nothing
          //return this.readNone();
      }
      this.scanner.throwUnexpectedToken();
    }
  },
  // ==== 追加 ======================================
  {
    key: "readNone",
    value: function readNone() {
      this.scanner.next();
      return {
        type: "none",
      };
    }
  }, {
    key: "readVariable",
    value: function readVariable() {
      var _this5 = this;

      this.scanner.expect("=");

      let nextStr = this.scanner.getNext();
      let str = "";
      if(nextStr == "{"){
        this.scanner.expect("{");
        this._readUntil("}", function () {
          str += _this5.scanner.peek();
          _this5.scanner.next();
        });
      }

      return {
        type: _Syntax2["default"].Variable,
        noteNumbers: [this._readNoteNumber(0)],
        noteLength: this._readLength(),
        textIndex: this.scanner.index,
      };
    }
  },
   // =============================================
  {
    key: "readNote",
    value: function readNote() {
      return {
        type: _Syntax2["default"].Note,
        noteNumbers: [this._readNoteNumber(0)],
        noteLength: this._readLength(),
        textIndex: this.scanner.index,
      };
    }
  }, {
    key: "readChord",
    value: function readChord() {
      var _this2 = this;

      this.scanner.expect("[");

      var noteList = [];
      var offset = 0;

      this._readUntil("]", function () {
        switch (_this2.scanner.peek()) {
          case "c":
          case "d":
          case "e":
          case "f":
          case "g":
          case "a":
          case "b":
            noteList.push(_this2._readNoteNumber(offset));
            break;
          case ">":
            _this2.scanner.next();
            offset += 12;
            break;
          case "<":
            _this2.scanner.next();
            offset -= 12;
            break;
          default:
            _this2.scanner.throwUnexpectedToken();
        }
      });

      this.scanner.expect("]");

      return {
        type: _Syntax2["default"].Note,
        noteNumbers: noteList,
        noteLength: this._readLength(),
        textIndex: this.scanner.index,
      };
    }
  }, {
    key: "readRest",
    value: function readRest() {
      this.scanner.expect("r");

      return {
        type: _Syntax2["default"].Rest,
        noteLength: this._readLength()
      };
    }
  }, {
    key: "readOctave",
    value: function readOctave() {
      this.scanner.expect("o");

      return {
        type: _Syntax2["default"].Octave,
        value: this._readArgument(/\d+/)
      };
    }
  }, {
    key: "readOctaveShift",
    value: function readOctaveShift(direction) {
      this.scanner.expect(/<|>/);

      return {
        type: _Syntax2["default"].OctaveShift,
        direction: direction | 0,
        value: this._readArgument(/\d+/)
      };
    }
  }, {
    key: "readNoteLength",
    value: function readNoteLength() {
      this.scanner.expect("l");

      return {
        type: _Syntax2["default"].NoteLength,
        noteLength: this._readLength()
      };
    }
  }, {
    key: "readNoteQuantize",
    value: function readNoteQuantize() {
      this.scanner.expect("q");

      return {
        type: _Syntax2["default"].NoteQuantize,
        value: this._readArgument(/\d+/)
      };
    }
  }, {
    key: "readNoteVelocity",
    value: function readNoteVelocity() {
      this.scanner.expect("v");

      return {
        type: _Syntax2["default"].NoteVelocity,
        value: this._readArgument(/\d+/)
      };
    }
  }, {
    key: "readTempo",
    value: function readTempo() {
      this.scanner.expect("t");

      return {
        type: _Syntax2["default"].Tempo,
        value: this._readArgument(/\d+(\.\d+)?/)
      };
    }
  },
  // ==== 追加 ======================================
  {
    key: "readDetune",
    value: function readDetune() {
      this.scanner.expect("D");

      return {
        type: _Syntax2["default"].Detune,
        value: this._readArgument(/(\+|\-)?\d+/)
      };
    }
  },
  {
    key: "readPan",
    value: function readPan() {
      this.scanner.expect("P");

      return {
        type: _Syntax2["default"].Pan,
        value: this._readArgument(/(\+|\-)?\d+(\.\d+)?/)
      };
    }
  },
  {
  key: "readTone",
    value: function readTone() {
      let nextStr = this.scanner.getNext()
      this.scanner.expect("@");
      // BaseTone
      if(nextStr == "["){
        this.scanner.expect("[");
        let str = "";
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readStr(/([a-z]|[A-Z]|\+|\-|#|[0-9])+/);
          if(val == null) _this4.scanner.next();
          else str += val;
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].BaseTone,
          value: str,
        }
      }
      // envelope
      else if(nextStr == "e"){
        this.scanner.expect("e");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/\d+(\.\d+)?/);
          if(val == null) _this4.scanner.next();
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Envelope,
          value: valueList
        };
      }
      // mute
      else if(nextStr == "m"){
        this.scanner.expect("m");
        return {
          type: _Syntax2["default"].Mute,
          value: this._readArgument(/\d+(\.\d+)?/) > 0 ? true : false
        }
      }
      // wave
      else if(nextStr == "w"){
        this.scanner.expect("w");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/\d+(\.\d+)?/);
          if(val == null) _this4.scanner.next();
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Wave,
          value: valueList
        };
      }
      // inst wave
      else if(nextStr == "W")
      {
        this.scanner.expect("w");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/\d+(\.\d+)?/);
          if(val == null) _this4.scanner.next();
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Wave,
          value: valueList
        };
      }
      // pitch
      else if(nextStr == "p"){
        this.scanner.expect("p");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/(\+|\-)?\d+(\.\d+)?/);
          if(val == null) {
            val = _this4._readStr("L");
            if(val == null){
              _this4.scanner.next();
            }else valueList.push(val);
          }
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Pitch,
          value: valueList
        };
      }
      // pan
      else if(nextStr == "P"){
        this.scanner.expect("P");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/(\+|\-)?\d+(\.\d+)?/);
          if(val == null) {
            val = _this4._readStr("L");
            if(val == null){
              _this4.scanner.next();
            }else valueList.push(val);
          }
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].InstPan,
          value: valueList
        };
      }
      // volume
      else if(nextStr == "v"){
        this.scanner.expect("v");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/(\+|\-)?\d+(\.\d+)?/);
          if(val == null) {
            val = _this4._readStr("L");
            if(val == null){
              _this4.scanner.next();
            }else valueList.push(val);
          }
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Volume,
          value: valueList
        };
      }
      // durty
      else if(nextStr == "d"){
        this.scanner.expect("d");
        this.scanner.expect("[");
        let valueList = []
        let _this4 = this;
        this._readUntil("]", function () {
          let val = _this4._readArgument(/(\+|\-)?\d+(\.\d+)?/);
          if(val == null) {
            val = _this4._readStr("L");
            if(val == null){
              _this4.scanner.next();
            }else valueList.push(val);
          }
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Durty,
          value: valueList
        };
      }
      // cmd
      else if(nextStr == "c"){
        this.scanner.expect("c");
        this.scanner.expect("[");
        let valueList = []
        let command = null;
        let _this4 = this;
        let isCommand = false
        this._readUntil("]", function () {
          let val = _this4._readArgument(/(\+|\-)?\d+(\.\d+)?/);
          if(val === null) {
            if(isCommand){
              val = _this4._readStr(/([a-z]|[A-Z]|\+|\-|#|[0-9])+/);
              if(val === null) _this4.scanner.next();
              else valueList.push(val);
            }
            else{
              val = _this4._readStr(/[a-z]+/);
              if(val === null) _this4.scanner.next();
              else {
                command = val;
                isCommand = true;
              }
            }
          }
          else valueList.push(val);
        });
        this.scanner.expect("]");
        return {
          type: _Syntax2["default"].Command,
          command: command,
          value: valueList
        };
      }

      return {
        type: _Syntax2["default"].Tone,
        value: this._readArgument(/\d+(\.\d+)?/)
      };
    }
  },
  // ==========================================
   {
    key: "readInfiniteLoop",
    value: function readInfiniteLoop() {
      this.scanner.expect("$");

      return {
        type: _Syntax2["default"].InfiniteLoop
      };
    }
  }, {
    key: "readLoop",
    value: function readLoop() {
      var _this3 = this;

      this.scanner.expect("/");
      this.scanner.expect(":");

      var result = [];
      var loopBegin = { type: _Syntax2["default"].LoopBegin };
      var loopEnd = { type: _Syntax2["default"].LoopEnd };

      result = result.concat(loopBegin);
      this._readUntil(/[|:]/, function () {
        result = result.concat(_this3.advance());
      });
      result = result.concat(this._readLoopExit());

      this.scanner.expect(":");
      this.scanner.expect("/");

      loopBegin.value = this._readArgument(/\d+/) || null;

      result = result.concat(loopEnd);

      return result;
    }
  }, {
    key: "_readUntil",
    value: function _readUntil(matcher, callback) {
      while (this.scanner.hasNext()) {
        this.scanner.forward();
        if (!this.scanner.hasNext() || this.scanner.match(matcher)) {
          break;
        }
        callback();
      }
    }
  }, {
    key: "_readArgument",
    value: function _readArgument(matcher) {
      var num = this.scanner.scan(matcher);

      return num !== null ? +num : null;
    }
  },{
    key: "_readStr",
    value: function _readStr(matcher) {
      var str = this.scanner.scan(matcher);

      return str !== null ? str : null;
    }
  },
   {
    key: "_readNoteNumber",
    value: function _readNoteNumber(offset) {
      var noteIndex = NOTE_INDEXES[this.scanner.next()];

      return noteIndex + this._readAccidental() + offset;
    }
  }, {
    key: "_readAccidental",
    value: function _readAccidental() {
      if (this.scanner.match("+")) {
        return +1 * this.scanner.scan(/\++/).length;
      }
      if (this.scanner.match("-")) {
        return -1 * this.scanner.scan(/\-+/).length;
      }
      return 0;
    }
  }, {
    key: "_readDot",
    value: function _readDot() {
      var len = (this.scanner.scan(/\.+/) || "").length;
      var result = new Array(len);

      for (var i = 0; i < len; i++) {
        result[i] = 0;
      }

      return result;
    }
  }, {
    key: "_readLength",
    value: function _readLength() {
      var result = [];

      result = result.concat(this._readArgument(/\d+/));
      result = result.concat(this._readDot());

      var tie = this._readTie();

      if (tie) {
        result = result.concat(tie);
      }

      return result;
    }
  }, {
    key: "_readTie",
    value: function _readTie() {
      this.scanner.forward();

      if (this.scanner.match("^")) {
        this.scanner.next();
        return this._readLength();
      }

      return null;
    }
  },
  // ======================= 追加 =======================
  {
    key: "readSlur",
    value: function readSlur() {
      this.scanner.expect("&");
      return {
        type: _Syntax2["default"].Slur,
        value: true
      };
    }
  },
  {
    key: "readKey",
    value: function readKey() {
      this.scanner.next();

      let minus = false;
      if (this.scanner.match("+")) {
        this.scanner.next();
      }
      if (this.scanner.match("-")) {
        this.scanner.next();
        minus = true;
      }

      let val = this._readArgument(/\d+(\.\d+)?/)
      val = minus ? -val : val;

      return {
        type: _Syntax2["default"].Key,
        value: val
      };
    }
  },
  // ==============================================
   {
    key: "_readLoopExit",
    value: function _readLoopExit() {
      var _this4 = this;

      var result = [];

      if (this.scanner.match("|")) {
        this.scanner.next();

        var loopExit = { type: _Syntax2["default"].LoopExit };

        result = result.concat(loopExit);

        this._readUntil(":", function () {
          result = result.concat(_this4.advance());
        });
      }

      return result;
    }
  }]);

  return MMLParser;
})();

exports["default"] = MMLParser;
module.exports = exports["default"];
},{"./Scanner":21,"./Syntax":22}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scanner = (function () {
  function Scanner(source) {
    _classCallCheck(this, Scanner);

    this.source = source;
    this.index = 0;
  }

  _createClass(Scanner, [{
    key: "hasNext",
    value: function hasNext() {
      return this.index < this.source.length;
    }
  }, {
    key: "peek",
    value: function peek() {
      return this.source.charAt(this.index) || "";
    }
  }, {
    key: "next",
    value: function next() {
      return this.source.charAt(this.index++) || "";
    }
  },
  // ============ 追加 ==============
  {
    key: "getNext",
    value: function getNext() {
      if(!this.hasNext()) return null
      return this.source.charAt(this.index+1) || "";
    }
  },
  // ==========================
   {
    key: "forward",
    value: function forward() {
      while (this.hasNext() && this.match(/\s/)) {
        this.index += 1;
      }
    }
  }, {
    key: "match",
    value: function match(matcher) {
      if (matcher instanceof RegExp) {
        return matcher.test(this.peek());
      }
      return this.peek() === matcher;
    }
  },
  // ============ 追加 ==============
   {
  key: "matchNext",
    value: function match(matcher) {
      if (matcher instanceof RegExp) {
        return matcher.test(this.getNext());
      }
      return this.getNext() === matcher;
    }
  },
  // ==========================
   {
    key: "expect",
    value: function expect(matcher) {
      if (!this.match(matcher)) {
        this.throwUnexpectedToken();
      }
      this.index += 1;
    }
  }, {
    key: "scan",
    value: function scan(matcher) {
      var target = this.source.substr(this.index);
      var result = null;

      if (matcher instanceof RegExp) {
        var matched = matcher.exec(target);

        if (matched && matched.index === 0) {
          result = matched[0];
        }
      } else if (target.substr(0, matcher.length) === matcher) {
        result = matcher;
      }

      if (result) {
        this.index += result.length;
      }

      return result;
    }
  }, {
    key: "throwUnexpectedToken",
    value: function throwUnexpectedToken() {
      var identifier = this.peek() || "ILLEGAL";

      throw new SyntaxError("Unexpected token: " + identifier);
    }
  }]);

  return Scanner;
})();

exports["default"] = Scanner;
module.exports = exports["default"];
},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = {
  Note: "Note",
  Rest: "Rest",
  Octave: "Octave",
  OctaveShift: "OctaveShift",
  NoteLength: "NoteLength",
  NoteVelocity: "NoteVelocity",
  NoteQuantize: "NoteQuantize",
  Tempo: "Tempo",
  Tone: "Tone",
  Slur: "Slur",
  Key: "key",
  Envelope: "Envelope",
  BaseTone: "BaseTone",
  Command: "Command",
  Mute: "Mute",
  Wave: "Wave",
  Pitch: "Pitch",
  Volume: "Volume",
  Durty: "Durty",
  Detune: "Detune",
  Pan: "Pan",
  InfiniteLoop: "InfiniteLoop",
  LoopBegin: "LoopBegin",
  LoopExit: "LoopExit",
  LoopEnd: "LoopEnd"
};
module.exports = exports["default"];
},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _MMLIterator = require("./MMLIterator");

var _MMLIterator2 = _interopRequireDefault(_MMLIterator);

exports["default"] = _MMLIterator2["default"];
module.exports = exports["default"];
},{"./MMLIterator":19}],24:[function(require,module,exports){
/*!
 * noncharacters <https://github.com/jonschlinkert/noncharacters>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = [
  '\uFFFF',
  '\uFFFE',

  '\uFDD1',
  '\uFDD2',
  '\uFDD3',
  '\uFDD4',
  '\uFDD5',
  '\uFDD6',
  '\uFDD7',
  '\uFDD8',
  '\uFDD9',
  '\uFDDA',
  '\uFDDB',
  '\uFDDC',
  '\uFDDD',
  '\uFDDE',
  '\uFDDF',
  '\uFDE0',
  '\uFDE1',
  '\uFDE2',
  '\uFDE3',
  '\uFDE4',
  '\uFDE5',
  '\uFDE6',
  '\uFDE7',
  '\uFDE8',
  '\uFDE9',
  '\uFDEA',
  '\uFDEB',
  '\uFDEC',
  '\uFDED',
  '\uFDEE',
  '\uFDEF'
];

},{}],25:[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],26:[function(require,module,exports){
/*!
 * parse-code-context <https://github.com/jonschlinkert/parse-code-context>
 * Regex originally sourced and modified from <https://github.com/visionmedia/dox>.
 *
 * Copyright (c) 2015 Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (str, i) {
  var match = null;

  // function statement
  if (match = /^function[ \t]([\w$]+)[ \t]*([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function statement',
      name: match[1],
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // function expression
  } else if (match = /^var[ \t]*([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function expression',
      name: match[1],
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // module.exports expression
  } else if (match = /^(module\.exports)[ \t]*=[ \t]*function[ \t]([\w$]+)[ \t]*([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function expression',
      receiver: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // module.exports method
  } else if (match = /^(module\.exports)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'method',
      receiver: match[1],
      name: '',
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '.' + match[2] + '()',
      original: str
    };
    // prototype method
  } else if (match = /^([\w$]+)\.prototype\.([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'prototype method',
      class: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '.prototype.' + match[2] + '()',
      original: str
    };
    // prototype property
  } else if (match = /^([\w$]+)\.prototype\.([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'prototype property',
      class: match[1],
      name: match[2],
      value: match[3],
      string: match[1] + '.prototype.' + match[2],
      original: str
    };
    // method
  } else if (match = /^([\w$.]+)\.([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'method',
      receiver: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '.' + match[2] + '()',
      original: str
    };
    // property
  } else if (match = /^([\w$]+)\.([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'property',
      receiver: match[1],
      name: match[2],
      value: match[3],
      string: match[1] + '.' + match[2],
      original: str
    };
    // declaration
  } else if (match = /^var[ \t]+([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'declaration',
      name: match[1],
      value: match[2],
      string: match[1],
      original: str
    };
  }
  return null;
};

},{}],27:[function(require,module,exports){
/*!
 * quoted-string-regex <https://github.com/jonschlinkert/quoted-string-regex>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function() {
  return /'([^'\\]*\\.)*[^']*'|"([^"\\]*\\.)*[^"]*"/g;
};

},{}],28:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"./lib":31,"dup":1}],29:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require("events");

var _TrackIterator = require("./TrackIterator");

var _TrackIterator2 = _interopRequireDefault(_TrackIterator);

var _webAudioScheduler = require("web-audio-scheduler");

var _webAudioScheduler2 = _interopRequireDefault(_webAudioScheduler);

var _objectAssign = require("object-assign");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SeqEmitter = (function (_EventEmitter) {
  _inherits(SeqEmitter, _EventEmitter);

  function SeqEmitter(tracks) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, SeqEmitter);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SeqEmitter).call(this));

    if (config.scheduler) {
      _this._scheduler = config.scheduler;
      _this._ownScheduler = false;
    } else {
      _this._scheduler = new _webAudioScheduler2.default(config);
      _this._ownScheduler = true;
    }

    _this._tracks = tracks.map(function (track, trackNumber) {
      return new _TrackIterator2.default(track, _this._scheduler.interval, trackNumber);
    });
    _this._startTime = -1;
    _this._stopTime = -1;
    _this._timerId = 0;
    _this._state = "suspended";
    return _this;
  }

  _createClass(SeqEmitter, [{
    key: "start",
    value: function start() {
      var _this2 = this;

      var t0 = arguments.length <= 0 || arguments[0] === undefined ? this._scheduler.currentTime : arguments[0];

      //console.log("this._scheduler.currentTime=" + this._scheduler.currentTime + " t0:" + t0 + " now:" + getCurrentTime());

      if (this._startTime === -1) {
        this._startTime = t0;
        if (this._ownScheduler) {
          this._scheduler.start();
        }
        this._timerId = this._scheduler.insert(t0, function (e) {
          _this2._state = "running";
          _this2.emit("statechange", { type: "statechange", playbackTime: t0, state: _this2._state });
          _this2._process(e.playbackTime);
        });
      } else {
        /* istanbul ignore else */
        /* eslint no-lonely-if: 0 */
        if (this._startTime !== -1) {
          global.console.warn("Failed to execute 'start' on SeqEmitter: cannot call start more than once.");
        }
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      var _this3 = this;

      var t0 = arguments.length <= 0 || arguments[0] === undefined ? this._scheduler.currentTime : arguments[0];

      if (this._startTime !== -1 && this._stopTime === -1) {
        this._stopTime = t0;
        this._scheduler.insert(t0, function () {
          _this3._state = "closed";
          _this3.emit("statechange", { type: "statechange", playbackTime: t0, state: _this3._state });
          if (_this3._ownScheduler) {
            _this3._scheduler.stop();
          }
          _this3._scheduler.remove(_this3._timerId);
          _this3._timerId = 0;
        });
      } else {
        if (this._startTime === -1) {
          global.console.warn("Failed to execute 'stop' on SeqEmitter: cannot call stop without calling start first.");
        }
        if (this._stopTime !== -1) {
          global.console.warn("Failed to execute 'stop' on SeqEmitter: cannot call stop more than once.");
        }
      }
    }
  },
   {
    key: "_process",
    value: function _process(playbackTime) {
      var _this4 = this;

      this._tracks.forEach(function (iter) {
        var iterItem = iter.next();
        _this4._emitEvent(iterItem.value, iter.trackNumber);
      });

      this._tracks = this._tracks.filter(function (iter) {
        return !iter.done;
      });

      if (this._tracks.length === 0) {
        this.emit("end:all", { type: "end:all", playbackTime: playbackTime });
      } else {
        var nextPlaybackTime = playbackTime + this._scheduler.interval;

        this._timerId = this._scheduler.insert(nextPlaybackTime, function (e) {
          _this4._process(e.playbackTime);
        });
      }
    }
  }, {
    key: "_emitEvent",
    value: function _emitEvent(events, trackNumber) {
      var _this5 = this;

      events.forEach(function (items) {
        var type = items.type;
        var playbackTime = _this5._startTime + items.time;

        if (typeof type === "string") {
          _this5.emit(type, (0, _objectAssign2.default)({ playbackTime: playbackTime, trackNumber: trackNumber }, items));
        }
      });
    }
  }, {
    key: "scheduler",
    get: function get() {
      return this._scheduler;
    }
  },
  // ===========================================================
  {
    key: "currentLength",
    get: function get() {
      var _this6 = this;
      let len = 0;
      for(let i = 0; i < _this6._tracks.length;++i){
        let track = _this6._tracks[i];
        if(track._iter != null) len = Math.max(len, track._iter._currentLength);
      }
      return len;
    }
  },
  // ===========================================================
   {
    key: "state",
    get: function get() {
      return this._state;
    }
  }]);

  return SeqEmitter;
})(_events.EventEmitter);

exports.default = SeqEmitter;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./TrackIterator":30,"events":6,"object-assign":25,"web-audio-scheduler":34}],30:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _intervalIterator = require("interval-iterator");

var _intervalIterator2 = _interopRequireDefault(_intervalIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TrackIterator = (function (_IntervalIterator) {
  _inherits(TrackIterator, _IntervalIterator);

  function TrackIterator(iter, interval, trackNumber) {
    _classCallCheck(this, TrackIterator);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrackIterator).call(this, iter, interval));

    _this.trackNumber = trackNumber;
    _this.done = false;
    return _this;
  }

  _createClass(TrackIterator, [{
    key: "next",
    value: function next() {
      if (this.done) {
        return { done: true, value: [] };
      }

      var iterItem = _get(Object.getPrototypeOf(TrackIterator.prototype), "next", this).call(this);

      this.done = iterItem.done;

      return iterItem;
    }
  }]);

  return TrackIterator;
})(_intervalIterator2.default);

exports.default = TrackIterator;
},{"interval-iterator":13}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _SeqEmitter = require("./SeqEmitter");

var _SeqEmitter2 = _interopRequireDefault(_SeqEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _SeqEmitter2.default;
},{"./SeqEmitter":29}],32:[function(require,module,exports){
/*!
 * strip-bom-string <https://github.com/jonschlinkert/strip-bom-string>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function(str) {
  if (typeof str === 'string' && str.charAt(0) === '\ufeff') {
    return str.slice(1);
  }
  return str;
};

},{}],33:[function(require,module,exports){
'use strict';

var extract = require('extract-comments');

/**
 * Strip comments from the given `string`.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 * @api public
 */

function strip(str, options) {
  options = options || {};
  if (options.line) {
    return line(str, options);
  }
  if (options.block) {
    return block(str, options);
  }
  if (options.first) {
    return first(str, options);
  }
  str = block(str, options);
  return line(str, options);
}

/**
 * Strip block comments from the given `string`.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 * @api public
 */

function block(str, options) {
  return stripEach(str, extract.block(str, options), options);
}

/**
 * Strip line comments from the given `string`.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 * @api public
 */

function line(str, options) {
  return stripEach(str, extract.line(str, options), options);
}

/**
 * Strip the first comment from the given `string`.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 * @api public
 */

function first(str, options) {
  return stripEach(str, extract.first(str), options);
}

/**
 * Private function for stripping comments.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 */

function stripEach(str, comments, options) {
  comments.forEach(function(comment) {
    str = discard(str, comment, options);
  });
  return str;
}

/**
 * Remove a comment from the given string.
 *
 * @param {String} `string`
 * @param {Object} `options` Pass `safe: true` to keep comments with `!`
 * @return {String}
 */

function discard(str, comment, opts) {
  var ch = comment.value.charAt(0);
  if (opts && opts.safe === true && ch === '!') {
    return str;
  }
  return str.replace(comment.raw, '');
}

/**
 * Expose `strip`
 */

module.exports = strip;

/**
 * Expose methods
 */

module.exports.block = block;
module.exports.first = first;
module.exports.line = line;

},{"extract-comments":8}],34:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./lib":37,"dup":13}],35:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require("events");

var _utilsDefaults = require("./utils/defaults");

var _utilsDefaults2 = _interopRequireDefault(_utilsDefaults);

var _defaultContext = require("./defaultContext");

var _defaultContext2 = _interopRequireDefault(_defaultContext);

var WebAudioScheduler = (function (_EventEmitter) {
  _inherits(WebAudioScheduler, _EventEmitter);

  function WebAudioScheduler() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, WebAudioScheduler);

    _get(Object.getPrototypeOf(WebAudioScheduler.prototype), "constructor", this).call(this);

    this.context = (0, _utilsDefaults2["default"])(opts.context, _defaultContext2["default"]);
    this.interval = (0, _utilsDefaults2["default"])(opts.interval, 0.025);
    this.aheadTime = (0, _utilsDefaults2["default"])(opts.aheadTime, 0.1);
    this.timerAPI = (0, _utilsDefaults2["default"])(opts.timerAPI, global);
    this.playbackTime = this.currentTime;

    this._timerId = 0;
    this._schedId = 0;
    this._scheds = [];
  }

  _createClass(WebAudioScheduler, [{
    key: "start",
    value: function start(callback) {
      var _this = this;

      if (this._timerId === 0) {
        this._timerId = this.timerAPI.setInterval(function () {
          var t0 = _this.context.currentTime;
          var t1 = t0 + _this.aheadTime;

          _this._process(t0, t1);
        }, this.interval * 1000);

        this.emit("start");
      }

      if (callback) {
        this.insert(this.context.currentTime, callback);
      }

      return this;
    }
  }, {
    key: "stop",
    value: function stop(reset) {
      if (this._timerId !== 0) {
        this.timerAPI.clearInterval(this._timerId);
        this._timerId = 0;

        this.emit("stop");
      }

      if (reset) {
        this._scheds.splice(0);
      }

      return this;
    }
  }, {
    key: "insert",
    value: function insert(time, callback, args) {
      var id = ++this._schedId;
      var event = { id: id, time: time, callback: callback, args: args };
      var scheds = this._scheds;

      if (scheds.length === 0 || scheds[scheds.length - 1].time <= time) {
        scheds.push(event);
      } else {
        for (var i = 0, imax = scheds.length; i < imax; i++) {
          if (time < scheds[i].time) {
            scheds.splice(i, 0, event);
            break;
          }
        }
      }

      return id;
    }
  }, {
    key: "nextTick",
    value: function nextTick(time, callback, args) {
      if (typeof time === "function") {
        args = callback;
        callback = time;
        time = this.playbackTime;
      }

      return this.insert(time + this.aheadTime, callback, args);
    }
  }, {
    key: "remove",
    value: function remove(schedId) {
      var scheds = this._scheds;

      if (typeof schedId === "number") {
        for (var i = 0, imax = scheds.length; i < imax; i++) {
          if (schedId === scheds[i].id) {
            scheds.splice(i, 1);
            break;
          }
        }
      }

      return schedId;
    }
  }, {
    key: "removeAll",
    value: function removeAll() {
      this._scheds.splice(0);
    }
  }, {
    key: "_process",
    value: function _process(t0, t1) {
      var scheds = this._scheds;

      this.playbackTime = t0;
      this.emit("process", { playbackTime: this.playbackTime });

      while (scheds.length && scheds[0].time < t1) {
        var _event = scheds.shift();
        var playbackTime = _event.time;
        var args = _event.args;

        this.playbackTime = playbackTime;

        _event.callback({ playbackTime: playbackTime, args: args });
      }

      this.playbackTime = t0;
      this.emit("processed", { playbackTime: this.playbackTime });
    }
  },
  // ===========================================================
  {
    key: "demo",
    value: function demo(t0, t1) {
      var scheds = this._scheds;

      this.playbackTime = t0;

      while (scheds.length && scheds[0].time < t1) {
        var _event = scheds.shift();
        var playbackTime = _event.time;
        var args = _event.args;

        this.playbackTime = playbackTime;

        _event.callback({ playbackTime: playbackTime, args: args });
      }

      this.playbackTime = t0;
    }
  },
  // ===========================================================
   {
    key: "state",
    get: function get() {
      return this._timerId !== 0 ? "running" : "suspended";
    }
  }, {
    key: "currentTime",
    get: function get() {
      return this.context.currentTime;
    }
  },
   {
    key: "events",
    get: function get() {
      return this._scheds.slice();
    }
  }]);

  return WebAudioScheduler;
})(_events.EventEmitter);

exports["default"] = WebAudioScheduler;
module.exports = exports["default"];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./defaultContext":36,"./utils/defaults":38,"events":6}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Object.defineProperties({}, {
  currentTime: {
    get: function get() {
      //return Date.now() / 1000;
      //console.log("currentTime = " + getCurrentTime() + " Date.Now = " + ( Date.now() / 1000 ) )
      return getCurrentTime();
    },
    configurable: true,
    enumerable: true
  }
});
module.exports = exports["default"];
},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _WebAudioScheduler = require("./WebAudioScheduler");

var _WebAudioScheduler2 = _interopRequireDefault(_WebAudioScheduler);

exports["default"] = _WebAudioScheduler2["default"];
module.exports = exports["default"];
},{"./WebAudioScheduler":35}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = defaults;

function defaults(value, defaultValue) {
  return value !== undefined ? value : defaultValue;
}

module.exports = exports["default"];
},{}]},{},[1])(1)
});