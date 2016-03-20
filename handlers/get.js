var repo = require('../data/repo');

var get = {
  allQuestions : function(req, res, next) {
    repo.getQuestions(req.params.limit | 10, function(questions) {
      res.send(questions);
      next();
    });
  },

  questionsSummary : function(req, res, next) {
    repo.getAllQuestionsSummary(function(result) {
      res.send(result);
    });
    next();
  },

  question : function(req, res, next) {
    var id = req.params.questionId;
    repo.getQuestion(id, function(question) {
      res.send(question);
      next();
    });
  }
};

module.exports = get;