var repo = require('../../data/questionsDynamoRepo');

var get = {
  allQuestions : function(req, res, next) {
    repo.getQuestions(req.params.limit | 10, true, function(questions) {
      res.send(questions);
      next();
    });
  },

  question : function(req, res, next) {
    var id = req.params.questionId;
    repo.getQuestion(id, function(question) {
      if (question) {
        res.send(question);
      } else {
        res.send(404, { 'message' : 'question not found. questionId=' + id });
      }
      next();
    });
  }
};

module.exports = get;