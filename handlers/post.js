var repo = require('../data/repo');
var rest = require('../util/rest');

var DIFFICULTIES = [ 'EASY', 'MEDIUM', 'HARD', 'EXPERT' ];
var post = {
  addQuestion : function(req, res, next) {
    var description = req.body;
    rest.pre(description['text'] != null, 'Question text is required');
    rest.pre(DIFFICULTIES.indexOf(description['difficulty']) >= 0, 'Question difficulty must be in ' + DIFFICULTIES);

    repo.addQuestion(description['difficulty'], description['text'], function(result) {
      res.send('Question "' + description['text'] + '" added with result ' + result);
    });

    next();
  },

  addAnswer : function(req, res, next) {
    var description = req.body;
    rest.pre(description['text'] != null, 'Answer text is required');

    repo.addAnswer(req.params.questionId, description['text'], description['correct'], description['pinned'], function(result) {
      res.send(result);
      next();
    });
  }
};

module.exports = post;