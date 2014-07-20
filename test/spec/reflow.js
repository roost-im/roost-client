'use strict';

(function() {
  describe('text reflow', function() {
    var assertReflowsAs = function(original, expected) {
      assert.equal(com.roost.reflow(original), expected);
    };
    it('should leave single lines alone', function() {
      var lines = [
        "a short line",
        "this is a line that gets close to 70 characters but doesn't go over",
        "this is a really long line that goes way over 80 characters because \
some people don't auto-wrap zephyrs"]
      for (var i = 0; i < lines.length; i++) {
        assertReflowsAs(lines[i], lines[i]);
      }
    });

    var paragraph =
      "Lorem ipsum dolor sit amet, eum omnis facete equidem ad. Quo cu\n\
decore ubique mnesarchum, meis disputando efficiantur mea no. Solum\n\
denique eu eam, ut altera malorum postulant pro. Id nominavi\n\
inimicus quo, et porro dicit officiis mel, decore erroribus an ius.";
    var reflowed = paragraph.replace(/\n/g, " ");

    it('should unflow paragraphs wrapped at 70+ columns', function() {
      assertReflowsAs(paragraph, reflowed);

      var wrappedAt80 = "\
Lorem ipsum dolor sit amet, eum omnis facete equidem ad. Quo cu decore ubi\n\
decore ubique mnesarchum, meis disputando efficiantur mea no. Solum denique\n\
eu eam, ut altera malorum postulant pro. Id nominavi inimicus quo, et porro\n\
dicit officiis mel, decore erroribus an ius.";
      assertReflowsAs(wrappedAt80, wrappedAt80.replace(/\n/g, " "));
    });

    it('should not reflow double-spaced lines', function() {
      var doubleSpaced = paragraph.replace(/\n/g, "\n\n");
      assertReflowsAs(doubleSpaced, doubleSpaced);

      var twoParagraphs = paragraph + "\n\n" + paragraph;
      assertReflowsAs(paragraph + "\n\n" + paragraph,
                      reflowed + "\n\n" + reflowed);
    });

    it('should not reflow lists', function() {
      var list = "1. a thing\n2. another thing.\n3. a third thing!";
      assertReflowsAs(list, list);
    });

    it('should reflow lines before 70 if the next word is long', function() {
      var sentence = "This is a testing sentence with a pretty long word:\n\
antidisestablishmentarianism.";
      assertReflowsAs(sentence, sentence.replace(/\n/g, " "));
    });

    it('should not reflow lines that start with whitespace', function() {
      var indented = "\
    here's some stuff that might be pseudocode for an algorithm in\n\
    some language, or maybe it's ascii art, or whatever.\n\
    but it does have a short line\n\
        and some of the lines have varying indentation."
      assertReflowsAs(indented, indented);
    });
  });
})();
