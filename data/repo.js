var cassandra = require('cassandra-driver');
var config = require('../config/config');
var uuid = require('node-uuid');
var async = require('async');

var GET_ALL_QUERY = 'SELECT * FROM questionLookup';
var GET_QUERY = 'SELECT * FROM questions WHERE id = ?';
var INSERT_QUESTION_QUERY = 'INSERT INTO questions ( id, created, modified, removed, difficulty, question ) ' +
  ' VALUES ( ?, toTimestamp(now()), toTimestamp(now()), false, ?, ? )';
var INSERT_LOOKUP_QUERY = 'INSERT INTO questionLookup ( difficulty, id, created ) VALUES ( ?, ?, toTimestamp(now()))';
var INSERT_ANSWER_QUERY = 'UPDATE questions SET answers[?] = ? WHERE id = ?';
var MARK_ANSWER_CORRECT_QUERY = 'UPDATE questions SET correctAnswer = ?, modified = toTimestamp(now()) WHERE id = ?';
var REMOVE_QUESTION_QUERY = 'UPDATE questions SET removed = true, modified = toTimestamp(now()) WHERE id = ?';
var UPDATE_QUESTION_QUERY = 'UPDATE questions SET question = ?, difficulty = ?, modified = toTimestamp(now()) WHERE id = ?';

var pinAnswerQuery = function(answerId) {
 return 'UPDATE questions SET pinnedAnswers = pinnedAnswers + { ' + answerId + ' } , modified = toTimestamp(now()) WHERE id = ?';
};

var unpinAnswerQuery = function(answerId) {
 return 'UPDATE questions SET pinnedAnswers = pinnedAnswers - { ' + answerId + ' } , modified = toTimestamp(now()) WHERE id = ?';
};

var removeAnswerQuery = function(answerId) {
  return 'UPDATE questions SET removedAnswers = removedAnswers + { ' + answerId + ' } , modified = toTimestamp(now()) WHERE id = ?';
};

var client = new cassandra.Client({ contactPoints: config.get('cassandra.nodes'), keyspace : config.get('cassandra.keyspace')});

// Given an array of IDs and a single string ID, find out if the id is in there
var containsUUID = function(id, ids) {
  if (ids) {
    for (var i=0; i < ids.length; i++) {
      if (id === ids[i].toString()) {
        return true;
      }
    }
  }
  return false;
};

var newQuestion = function(id, text, difficulty, removed) {
  return {
    id : id,
    question : text,
    difficulty : difficulty,
    removed: removed,
    answers : []
  };
};

var newAnswer = function(id, text, correct, pinned) {
  return {
    id : id,
    text : text,
    correct : correct,
    pinned : pinned
  };
};

var updateResponse = function(success, message) {
  return {
    success : success,
    message : message
  };
};

// Given a Cassandra row describing a question, return a good looking question object
var makeQuestionsObject = function(row) {
  var question = newQuestion(row.id, row.question, row.difficulty, row.removed);
  var answers = row.answers;
  if (answers) {
    for (var answerId in answers) {
      // If the answer hasn't been removed, add it
      if(answers.hasOwnProperty(answerId) && !containsUUID(answerId, row.removedAnswers)) {
        question.answers.push(
          newAnswer(
            answerId, 
            answers[answerId], 
            !!(row.correctanswer && answerId === row.correctanswer.toString()), 
            containsUUID(answerId, row.pinnedAnswers)
          ));
      }
    }
  }

  return question;
};

var repo = {
  getAllQuestionsSummary : function(callback) {
    client.execute(GET_ALL_QUERY, function(err, result) {
      callback(result.rows);
    });
  },

  getQuestions : function(limit, afterQuestionsCallback) {
    repo.getAllQuestionsSummary(function(rows) {
      if (!rows || rows.length === 0) {
        afterQuestionsCallback([]);
        return;
      }

      var end = rows.length > limit ? limit : rows.length;
      var rowsToGet = rows.slice(0, end);
      var questions = []; 
      async.each(
        rowsToGet, 
        function(item, afterEachRowCallback) {
          repo.getQuestion(item.id, function(question) {
            if (question) {
              var questionObj = makeQuestionsObject(question);
              //console.log(questionObj);
              questions.push(questionObj);
            }

            // This tells async.js this iteration is all done
            afterEachRowCallback();
          });
        }, 
        function done(err) {
          afterQuestionsCallback(questions);
        }
      );
    });
  },

  getQuestion : function(id, callback) {
    client.execute(GET_QUERY, [id], function(err, result) {
      if (err) {
        console.log(err);
        throw new Error(err.message);
      }
      callback(result ? result.rows[0] : null);
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
        callback(newQuestion(id, text, difficulty, false));
      });
    });
  },

  updateQuestion : function(questionId, text, difficulty, callback) {
    client.execute(UPDATE_QUESTION_QUERY, [text, difficulty, questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed updating quesiton ' + questionId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Updated question ' + questionId));
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

      callback(newAnswer(answerId, text, correct, pinned));
    });
  },

  updateAnswerText : function(questionId, answerId, text, callback) {
    // insert also updates
    client.execute(INSERT_ANSWER_QUERY, [answerId, text, questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed updating answer ' + answerId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Updated answer ' + answerId));
    });
  },

  pinAnswer : function(questionId, answerId, callback) {
    client.execute(pinAnswerQuery(answerId), [questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed pinning answer ' + answerId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Pinned answer ' + answerId));
    });
  },

  unpinAnswer : function(questionId, answerId, callback) {
    client.execute(unpinAnswerQuery(answerId), [questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed unpinning answer ' + answerId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Pinned unanswer ' + answerId));
    });
  },

  markAnswerCorrect : function(questionId, answerId, callback) {
    client.execute(MARK_ANSWER_CORRECT_QUERY, [answerId, questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed marking correct answer ' + answerId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Marked correct answer ' + answerId));
    });
  },

  removeAnswer : function(questionId, answerId) {
    client.execute(removeAnswerQuery(answerId), [questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed removing answer ' + answerId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Removed answer ' + answerId));
    });
  },

  removeQuestion : function(questionId, callback) {
    console.log('removing question ' + questionId);
    client.execute(REMOVE_QUESTION_QUERY, [questionId], function(err, result) {
      if (err) {
        console.log(err);
        callback(updateResponse(false, 'Failed removing quesiton ' + questionId + ': ' + err.message));
      }

      callback(updateResponse(true, 'Removed question ' + questionId));
    });
  }


};

module.exports = repo;