var repo = require('../../data/questionsDynamoRepo');
var rest = require('../../util/rest');

var DIFFICULTIES = [ 'EASY', 'MEDIUM', 'HARD', 'EXPERT' ];
var post = {
  addQuestion : function(req, res, next) {
    var description = req.body;
    console.log(description);
    rest.pre(description['text'] != null, 'Question text is required');
    rest.pre(description['category'] != null, 'Question category is required');
    //rest.pre(DIFFICULTIES.indexOf(description['difficulty']) >= 0, 'Question difficulty must be in ' + DIFFICULTIES);

    repo.addQuestion(description['difficulty'], description['text'], description['category'], function(result) {
      res.send(201, result);
    });

    next();
  },

  addAnswer : function(req, res, next) {
    var description = req.body;
    rest.pre(description['text'] != null, 'Answer text is required');

    repo.addAnswer(req.params.questionId, description['text'], description['correct'], description['pinned'], function(result) {
      res.send(201, result);
      next();
    });
  }
};

module.exports = post;