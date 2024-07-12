(function () {
    ace.define("ace/mode/mml_highlight_rules",[], function(require, exports, module) {"use strict";

        var oop = require("../lib/oop");
        var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
        
        var MMLHighlightRules = function() {
            this.$rules = {
                "start" : [
                    {
                        token : "comment", // comments are not allowed, but who cares?
                        regex : "\\/\\/.*$"
                    }, {
                        token : "comment.start", // comments are not allowed, but who cares?
                        regex : "\\/\\*",
                        next  : "comment"
                    },
                    {
                        token : "variable.start", // single line
                        regex : /(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*{/,
                        next  : "variable"
                    },
                    {
                        token : "variable", // single line
                        regex : /(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*.*/,
                    },
                    {
                        token : "inst",
                        regex : /@\s*\[([a-z|A-Z])+\]\s*/,
                    },
                    {
                        token : "command",
                        regex : /([o|k|v|t|@|l|q]\d+)/,
                    },
                    {
                        token : "command",
                        regex : /@[a-z]\d+/,
                    },
                    {
                        token : "command",
                        regex : /@[a-z]\[(\s*\d+\.?\d*\s*,?)*\]/,
                    },
                    {
                        token : "note",
                        regex : /[a-g][\+\-]*/,
                    },
                    {
                        token : "rest",
                        regex : /[r]+/,
                    },
                    {
                        token : "number",
                        regex : /[\+\-]?(\d+)/,
                    },
                    {
                        token : "piriod",
                        regex : /\.+/,
                    },
                    {
                        token : "tie",
                        regex : /\^+/,
                    },
                    {
                        token : "slur",
                        regex : /\&+/,
                    },
                    {
                        token : "code",
                        regex : /(\[)|(\])/,
                    },
                    {
                        token : "repeat",
                        regex : /(\/:)|(:\/)(\d*)/,
                    },
                    {
                        token : "track",
                        regex : /;/,
                    },
                    {
                        token : "octave",
                        regex : /[<>]/,
                    },
                    {
                        token : "string",
                        regex : /"/,
                        next  : "string"
                    },
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
                        token : "variable.end", // comments are not allowed, but who cares?
                        regex : /}\s*$/,
                        next  : "start"
                    }, {
                        defaultToken: "variable"
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

        ace.define("ace/theme/ace-mml", ["require", "exports", "module", "ace/lib/dom"], function(require, exports, module) {
            exports.isDark = true;
            exports.cssClass = "ace-mml";
            exports.cssText = ""; // CSSテキストは空にします
        
            var dom = require("../lib/dom");
            dom.importCssString(exports.cssText, exports.cssClass);
        });
})();

                