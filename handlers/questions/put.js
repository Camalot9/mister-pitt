var repo = require('../../data/questionsDynamoRepo');
var rest = require('../../util/rest');

var handleUpdate = function(result, response) {
  var status = 200;
  if (!result.success) {
    status = 500;
  }
  response.send(status, result);
};

var post = {
  updateQuestion : function(req, res, next) {
    var questionId = req.params['questionId'];
    var updateRequest = req.body;

    repo.updateQuestion(questionId, updateRequest.text, updateRequest.difficulty, updateRequest.category, function(result) {
      handleUpdate(result, res);
    });

    next();
  },

  undeleteQuestion : function(req, res, next) {
    var questionId = req.params['questionId'];

    repo.unremoveQuestion(questionId, function(result) {
      handleUpdate(result, res);
    });

    next();
  },

  updateAnswerText : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];
    var updateRequest = req.body;

    repo.updateAnswerText(questionId, answerId, updateRequest.text, function(result) {
      handleUpdate(result, res);
    });

    next();
  },

  undeleteAnswer : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];

    repo.unremoveAnswer(questionId, answerId, function(result) {
      handleUpdate(result, res);
    });

    next();
  },

  pinAnswer : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];

    repo.pinAnswer(questionId, answerId, function(result) {
      handleUpdate(result, res);
    });

    next();
  },

  updateAnswerCorrect : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];

    repo.markAnswerCorrect(questionId, answerId, function(result) {
      handleUpdate(result, res);
    });

    next();
  }  
};

module.exports = post;