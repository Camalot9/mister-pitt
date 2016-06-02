var repo = require('../../data/questionsDynamoRepo');
var rest = require('../../util/rest');

var makeError = function(message) {
  return {
    'success' : false,
    'error' : true,
    'message' : message
  };
};

var post = {
  addQuestion : function(req, res, next) {
    var description = req.body;

    if (!description['text']) {
      res.send(400, makeError('Question text is required'));
    }
    else if (!description['category']) {
      res.send(400, makeError('Question category is required'));
    }
    else if (!description['difficulty'] || !Number.isInteger(description['difficulty']) || description['difficulty'] < 1 || description['difficulty'] > 10) {
      res.send(400, makeError('Difficulty must be a number between 1 and 10'));
    }
    else {
      repo.addQuestion(description['difficulty'], description['text'], description['category'], function(result) {
        res.send(201, result);
      });
    }

    next();
  },

  addAnswer : function(req, res, next) {
    var description = req.body;
    if (!description['text']) {
      res.send(400, makeAnswer('Answer text is required'));
    }
    else {
      repo.addAnswer(req.params.questionId, description['text'], description['correct'], description['pinned'], function(result) {
        res.send(201, result);
      });
    }

    next();
  }
};

module.exports = post;