var repo = require('../data/repo');
var rest = require('../util/rest');

var handleDelete = function(result, response) {
  var status = 200;
  if (!result.success) {
    status = 500;
  }
  response.send(status, result);
};

var post = {
  removeQuestion : function(req, res, next) {
    var questionId = req.params['questionId'];

    repo.removeQuestion(questionId, function(result) {
      handleDelete(result, res);
    });

    next();
  },

  removeAnswer : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];

    repo.removeAnswer(questionId, answerId, function(result) {
      handleDelete(result, res);
    });

    next();
  },

  unpinAnswer : function(req, res, next) {
    var questionId = req.params['questionId'];
    var answerId = req.params['answerId'];

    repo.unpinAnswer(questionId, answerId, function(result) {
      handleDelete(result, res);
    });

    next();
  }
};

module.exports = post;