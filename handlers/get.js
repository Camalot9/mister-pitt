var get = {
  allQuestions : function(req, res, next) {
    res.send('got all questions from the database');
    next();
  },

  question : function(req, res, next) {
    var id = req.params.id;
    res.send('got question' + id + ' from the database');
    next();
  }
};

module.exports = get;