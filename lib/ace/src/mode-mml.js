ace.define("ace/mode/mml_highlight_rules",[], function(require, exports, module) {"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var MMLHighlightRules = function() {
    this.$rules = {
        "start" : [
            {
                token : "string", // single line
                regex : /(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*{/,
                next  : "variable"
            },
            {
                token : "string", // single line
                regex : /(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*.*/,
            },
            {
                token : "string", // single line
                regex : '"',
                next  : "string"
            },
            {
                token : "constant.character", // char
                regex : "@.+[0-9]+"
            },
            {
                token : "constant.character", // char
                regex : "@"
            },
            {
                token : "constant.numeric", // float
                regex : /[0-9]+\.+/
            },
            {
                token : "constant.numeric", // float
                regex : /[0-9]+/
            },
            {
                token : "constant.numeric", // float
                regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token : "constant.language.boolean",
                regex : "(?:true|false)\\b"
            }, {
                token : "text", // single quoted strings are not allowed
                regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            },
            {
                token : "constant.character", // char
                regex : /([a-z]|[A-Z]|\+|-)+/
            },
            {
                token : "punctuation.operator", // char
                regex : /(<|>|#)/
            },
            {
                token : "comment", // comments are not allowed, but who cares?
                regex : "\\/\\/.*$"
            }, {
                token : "comment.start", // comments are not allowed, but who cares?
                regex : "\\/\\*",
                next  : "comment"
            }, {
                token : "paren.lparen",
                regex : "[[({]"
            }, {
                token : "paren.rparen",
                regex : "[\\])}]"
            }, {
                token : "punctuation.operator",
                regex : /[,]/
            }, {
                token : "text",
                regex : "\\s+"
            }
        ],
        "string" : [
            {
                token : "constant.language.escape",
                regex : /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
            }, {
                token : "string",
                regex : '"|$',
                next  : "start"
            }, {
                defaultToken : "string"
            }
        ],
        "variable" : [
            {
                token : "string", // comments are not allowed, but who cares?
                regex : /}\s*$/,
                next  : "start"
            }, {
                defaultToken: "string"
            }
        ],
        "comment" : [
            {
                token : "comment.end", // comments are not allowed, but who cares?
                regex : "\\*\\/",
                next  : "start"
            }, {
                defaultToken: "comment"
            }
        ]
    };
    
};

oop.inherits(MMLHighlightRules, TextHighlightRules);

exports.MMLHighlightRules = MMLHighlightRules;

});

ace.define("ace/mode/mml",[], function(require, exports, module) {
    "use strict";
 
    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;
 
    var MMLHighlightRules = require("./mml_highlight_rules").MMLHighlightRules;
 
    var Mode = function() {
       this.HighlightRules = MMLHighlightRules;
    };
    oop.inherits(Mode, TextMode);
 
    exports.Mode = Mode;
 });
                (function() {
                    ace.require(["ace/mode/mml"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            