/*global describe, it */
'use strict';

// Apparently PhantomJS is terrible.
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
    fToBind = this,
    fNOP = function () {},
    fBound = function () {
      return fToBind.apply(this instanceof fNOP && oThis
                           ? this
                           : oThis,
                           aArgs.concat(Array.prototype.slice.call(arguments)));
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

(function () {
  describe('ztext parser', function() {
    var ztext = com.roost.ztext;
    it('should parse strings as is', function() {
      assert.deepEqual(ztext.parseZtext("foo{}"), ["foo{}"]);
    });

    it('should parse a bolded string', function() {
      assert.deepEqual(ztext.parseZtext("moo @bold{moo}"),
                       ["moo ",
                        new ztext.ZtextNode("bold", "{", "}", ["moo"])]);
    });

    it('should handle all types of delimiters', function() {
      assert.deepEqual(ztext.parseZtext("@<moo @bold{moo} @asdf(parens)>"),
                       [
                         new ztext.ZtextNode("", "<", ">", [
                           "moo ",
                           new ztext.ZtextNode("bold", "{", "}", ["moo"]),
                           " ",
                           new ztext.ZtextNode("asdf", "(", ")", ["parens"])
                         ])
                       ]);
    });

    it('should never insert empty strings', function() {
      assert.deepEqual(ztext.parseZtext(""), []);

      assert.deepEqual(ztext.parseZtext("@{}"),
                       [new ztext.ZtextNode("", "{", "}", [])]);
    });

    it('should parse escaped @ signs', function() {
      assert.deepEqual(ztext.parseZtext("foo@@bar@@@@@@"),
                       ["foo@bar@@@"]);
    });

    it('should treat syntax errors as plain text', function() {
      assert.deepEqual(ztext.parseZtext("foo@bar {}"),
                       ["foo@bar {}"]);
    });

    it('should allow numbers and _ in tag names', function() {
      assert.deepEqual(ztext.parseZtext("@aAzZ_09{moo}"),
                       [new ztext.ZtextNode("aAzZ_09", "{", "}", ["moo"])]);
    });
  })

  describe('event target', function() {
    it('should behave correctly when manipulated mid-dispatch', function() {
      var handlerLog = [];
      var target = new RoostEventTarget();

      function handler0() {
        handlerLog.push(0);
      }
      function handler1() {
        handlerLog.push(1);
        target.removeEventListener("test", handler0);
        target.removeEventListener("test", handler2);
        target.addEventListener("test", handler3);
      }
      function handler2() {
        handlerLog.push(2);
      }
      function handler3() {
        handlerLog.push(3);
      }

      target.addEventListener("test", handler0);
      target.addEventListener("test", handler1);
      target.addEventListener("test", handler2);

      handlerLog = [];
      target.dispatchEvent({type: "test"});
      assert.deepEqual(handlerLog, [0, 1]);

      handlerLog = [];
      target.dispatchEvent({type: "test"});
      assert.deepEqual(handlerLog, [1, 3]);

      handlerLog = [];
      target.dispatchEvent({type: "test"});
      assert.deepEqual(handlerLog, [1, 3]);
    });
  });

  describe('url finder', function() {
    function UrlTest() {
      this.log_ = [];
      this.expected_ = [];
    };
    UrlTest.prototype.expectUrl = function(url) {
      this.expected_.push(['url', url]);
    };
    UrlTest.prototype.expectText = function(text) {
      this.expected_.push(['text', text]);
    };
    UrlTest.prototype.gotUrl_ = function(url) {
      this.log_.push(['url', url]);
    };
    UrlTest.prototype.gotText_ = function(text) {
      this.log_.push(['text', text]);
    };
    UrlTest.prototype.run = function(str) {
      findUrls(str,
               this.gotUrl_.bind(this),
               this.gotText_.bind(this));
      assert.deepEqual(this.log_, this.expected_);
    };

    it('should parse multiple URLs', function() {
      var test = new UrlTest();
      test.expectText("Roost lives at ");
      test.expectUrl("https://roost.mit.edu");
      test.expectText(", not at ");
      test.expectUrl("http://roost.mit.edu");
      test.expectText(".");
      test.run(
        "Roost lives at https://roost.mit.edu, not at http://roost.mit.edu.");
    });

    it('should never give empty strings', function() {
      var test = new UrlTest();
      test.expectUrl("https://roost.mit.edu");
      test.run("https://roost.mit.edu");
    });

    it('should handle parenthesis', function() {
      var test = new UrlTest();
      test.expectText("(This URL is ");
      test.expectUrl("https://en.wikipedia.org/wiki/Owl_(disambiguation)");
      test.expectText(")");
      test.run("(This URL is https://en.wikipedia.org/wiki/Owl_(disambiguation))")
    });

    it('should start at word boundaries', function() {
      var test = new UrlTest();
      test.expectText("mooohttp://example.com");
      test.run("mooohttp://example.com");
    });

    it('should allow unicode hostnames', function() {
      var test = new UrlTest();
      test.expectUrl("http://☃.net");
      test.run("http://☃.net");
    });

    it('should allow port numbers', function() {
      var test = new UrlTest();
      test.expectUrl("https://davidben.net:443/is-crazy.txt");
      test.run("https://davidben.net:443/is-crazy.txt");
    });

    it('should not hang on a stray open paren', function() {
      var test = new UrlTest();
      var url = "http://example.com/something/really/really/really/long(and/even/more/longness/long";
      test.expectUrl(url);
      test.run(url);
    });

    it('should not extend paths without a /', function() {
      var test = new UrlTest();
      test.expectUrl("https://davidben.net");
      test.expectText("(1234)");
      test.run("https://davidben.net(1234)");
    });
  });

  describe('long zuser', function() {
    it('should expand simple strings', function() {
      assert.strictEqual(longZuser("davidben"), "davidben@ATHENA.MIT.EDU");
    });

    it('should not expand cross-realm principals', function() {
      assert.strictEqual(longZuser("davidben@ZONE.MIT.EDU"),
                         "davidben@ZONE.MIT.EDU");
    });

    it('should not expand the empty recipient', function() {
      assert.strictEqual(longZuser(""), "");
    });

    it('should handle trailing @s', function() {
      assert.strictEqual(longZuser("davidben@"), "davidben@ATHENA.MIT.EDU");
    });
  });

  describe('short zuser', function() {
    it('should strip off the default realm', function() {
      assert.strictEqual(shortZuser("davidben@ATHENA.MIT.EDU"), "davidben");
    });

    it('should not shorten cross-realm principals', function() {
      assert.strictEqual(shortZuser("davidben@ZONE.MIT.EDU"),
                         "davidben@ZONE.MIT.EDU");
    });

    it('should handle trailing @s', function() {
      assert.strictEqual(shortZuser("davidben@"), "davidben");
    });
  });

  describe('zuser realm', function() {
    it('should handle the default realm', function() {
      assert.strictEqual(zuserRealm("davidben"), "ATHENA.MIT.EDU");
      assert.strictEqual(zuserRealm(""), "ATHENA.MIT.EDU");
    });

    it('should handle cross-realm recipients', function() {
      assert.strictEqual(zuserRealm("@ZONE.MIT.EDU"), "ZONE.MIT.EDU");
      assert.strictEqual(zuserRealm("davidben@ZONE.MIT.EDU"), "ZONE.MIT.EDU");
    });

    it('should handle trailing @s', function() {
      assert.strictEqual(zuserRealm("davidben@"), "ATHENA.MIT.EDU");
      assert.strictEqual(zuserRealm("@"), "ATHENA.MIT.EDU");
    });
  });
})();
