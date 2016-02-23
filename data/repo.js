var cassandra = require('cassandra-driver');
var config = require('../config/config');
var uuid = require('node-uuid');

var GET_ALL_QUERY = 'SELECT * FROM questionLookup';
var GET_QUERY = 'SELECT * FROM questions WHERE id = ?';
var INSERT_QUESTION_QUERY = 'INSERT INTO questions ( id, created, modified, removed, difficulty, question ) ' +
  ' VALUES ( ?, toTimestamp(now()), toTimestamp(now()), false, ?, ? )';
var INSERT_LOOKUP_QUERY = 'INSERT INTO questionLookup ( difficulty, id ) VALUES ( ?, ? )';
var INSERT_ANSWER_QUERY = 'UPDATE questions SET answers[?] = ? WHERE id = ?';
var MARK_ANSWER_CORRECT_QUERY = 'UPDATE questions SET correctAnswer = ?, modified = toTimestamp(now()) WHERE id = ?';
var REMOVE_QUESTION_QUERY = 'UPDATE questions SET removed = true, modified = toTimestamp(now()) WHERE id = ?';

var pinAnswerQuery = function(answerId) {
 return 'UPDATE questions SET pinnedAnswers = pinnedAnswers + [ ' + answerId + ' ] , modified = toTimestamp(now()) WHERE id = ?';
};

var removeAnswerQuery = function(answerId) {
  return 'UPDATE questions SET removedAnswers = removedAnswers + [ ' + answerId + ' ] , modified = toTimestamp(now()) WHERE id = ?';
};

var client = new cassandra.Client({ contactPoints: config.get('cassandra.nodes'), keyspace : config.get('cassandra.keyspace')});

var repo = {
  getAllQuestions : function(callback) {
    client.execute(GET_ALL_QUERY, function(err, result) {
      callback(result);
    });
  },

  getQuestion : function(id, callback) {
    client.execute(GET_QUERY, [id], function(err, result) {
      if (err) {
        console.log(err);
        throw new Error(err.message);
      }

      callback(result === undefined ? null : result.rows[0]);
    });
  },

  // TODO How do we de-dupe?
  addQuestion : function(difficulty, text, callback) {
    var id = uuid.v4();
    client.execute(INSERT_QUESTION_QUERY, [id, difficulty, text], function(err, result) {
      // TODO clean up error handling
      // Should not return the cassandra result, should put it in a different type
      // Remove above line if lookup entry fails? I guess if there's data not in the lookup table it will just get ignored
      if (err) {
        console.log(err);
        throw new Error(err.message);
      }

      client.execute(INSERT_LOOKUP_QUERY, [difficulty, id], function(err, result) {
        if (err) {
          console.log(err);
          throw new Error(err.message);
        }
        callback(result);
      });
    });
  },

  addAnswer : function(questionId, text, correct, pinned, callback) {
    var answerId = uuid.v4();
    client.execute(INSERT_ANSWER_QUERY, [answerId, text, questionId], function(err, result) {
      if (err) {
        console.log(err);
        throw new Error(err.message);
      }

      if (correct === true) {
        client.execute(MARK_ANSWER_CORRECT_QUERY, [answerId, questionId], function(err, result) {
          if (err) {
            console.log('ERROR marking question as correct. questionId=' + answerId +
              ', answerId=' + answerId + ', error: ' + err.message);
          }
        });
      }

      if (pinned === true) {
        client.execute(pinAnswerQuery(answerId), [questionId], function(err, result) {
          if (err) {
            console.log('Error pinning a question. questionId=' + answerId +
            ', answerId=' + answerId + ', error: ' + err.message);
          }
        });
      }

      callback(result);
    });
  },

  removeAnswer : function(questionId, answerId) {
    client.execute(removeAnswerQuery(answerId), [questionId], function(err, result) {
      if (err) {
        console.log(err);
        throw new Error('Failed removing answer ' + answerId + ', message=' + err.message);
      }

      callback(result);
    });
  },

  removeQuestion : function(questionId) {
    client.execute(REMOVE_QUESTION_QUERY, [questionId], function(err, result) {
      if (err) {
        console.log(err);
        throw new Error('Failed removing answer ' + answerId + ', message=' + err.message);
      }

      callback(result);
    });
  }


};

module.exports = repo;