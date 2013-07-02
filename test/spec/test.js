/*global describe, it */
'use strict';

/*
Yes, I know the syntax is really weird.  Yeoman set that up... I do
not understand JavaScript developers. But this thing has a cute
phantomjs runner so let's just stick with it unless
expect(it).gets.to.be.way.too.irritating.
*/

(function () {
  describe('ztext parser', function() {
    function ztextTreeEquals(a, b) {
      if (a.length !== b.length)
        return false;
      for (var i = 0; i < a.length; i++) {
        if (typeof a[i] == "string" || typeof b[i] == "string") {
          if (a[i] !== b[i])
            return false;
        } else {
          if (a[i].tag !== b[i].tag ||
              a[i].open !== b[i].open ||
              a[i].close !== b[i].close ||
              !ztextTreeEquals(a[i].children, b[i].children))
            return false;
        }
      }
      return true;
    }

    it('should parse strings as is', function() {
      expect(ztextTreeEquals(
        parseZtext("foo{}"),
        ["foo{}"]
      )).to.be.true;
    });

    it('should parse a bolded string', function() {
      expect(ztextTreeEquals(
        parseZtext("moo @bold{moo}"),
        ["moo ", new ZtextNode("bold", "{", "}", ["moo"])]
      )).to.be.true;
    });

    it('should handle all types of delimiters', function() {
      expect(ztextTreeEquals(
        parseZtext("@<moo @bold{moo} @asdf(parens)>"),
        [
          new ZtextNode("", "<", ">", [
            "moo ",
            new ZtextNode("bold", "{", "}", ["moo"]),
            " ",
            new ZtextNode("asdf", "(", ")", ["parens"])
          ])
        ]
      )).to.be.true;
    });

    it('should never insert empty strings', function() {
      expect(ztextTreeEquals(
        parseZtext(""),
        [ ]
      )).to.be.true;

      expect(ztextTreeEquals(
        parseZtext("@{}"),
        [ new ZtextNode("", "{", "}", []) ]
      )).to.be.true;
    });

    it('should parse escaped @ signs', function() {
      expect(ztextTreeEquals(
        parseZtext("foo@@bar@@@@@@"),
        [ "foo@bar@@@" ]
      )).to.be.true;
    });

    it('should treat syntax errors as plain text', function() {
      expect(ztextTreeEquals(
        parseZtext("foo@bar {}"),
        [ "foo@bar {}" ]
      )).to.be.true;
    });

    it('should allow numbers and _ in tag names', function() {
      expect(ztextTreeEquals(
        parseZtext("@aAzZ_09{moo}"),
        [ new ZtextNode("aAzZ_09", "{", "}", ["moo"]) ]
      )).to.be.true;
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
      expect(handlerLog).to.deep.equal([0, 1]);

      handlerLog = [];
      target.dispatchEvent({type: "test"});
      expect(handlerLog).to.deep.equal([1, 3]);

      handlerLog = [];
      target.dispatchEvent({type: "test"});
      expect(handlerLog).to.deep.equal([1, 3]);
    });
  });
})();
