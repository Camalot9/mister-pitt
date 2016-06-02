var config = require('../config/config');
var uuid = require('node-uuid');
var async = require('async');
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var client = new AWS.DynamoDB.DocumentClient({
  'httpOptions' : {
    'timeout' : 5000
  }
});

var QUESTION_TABLE = 'questions';

var newQuestion = function(text, difficulty, category) {
  return {
    id : '' + uuid.v4(),
    text : text,
    difficulty : difficulty,
    category: category,
    answers : {},
    removed: false,
    correctAnswer: null,
    created : Date.now(),
    modified : Date.now()
  };
};

var newAnswer = function(text, pinned) {
  return {
    id : '' + uuid.v4(),
    text : text,
    pinned : pinned,
    removed: false,
    created : Date.now(),
    modified : Date.now()
  };
};

var transformAnswer = function(repoAnswer, isCorrect) {
  return {
    id : repoAnswer.id,
    text : repoAnswer.text,
    pinned : repoAnswer.pinned,
    removed : repoAnswer.removed,
    correct : isCorrect
  };
};

var transformAnswers = function(answerMap, correctAnswer, includeRemovedAnswers) {
  var answerList = [];
  if (answerMap) {
    var keys = Object.keys(answerMap);
    for (var i=0; i < keys.length; i++) {
      var answer = answerMap[keys[i]];
      if (includeRemovedAnswers || !answer.removed) {
        answerList.push(transformAnswer(answer, correctAnswer === answer.id)); 
      }
    }
  }
  return answerList;
};

var transformQuestion = function(repoQuestion, includeRemovedAnswers) {
  return {
    id : repoQuestion.id,
    text : repoQuestion.text,
    difficulty : repoQuestion.difficulty,
    category : repoQuestion.category,
    removed : repoQuestion.removed,
    answers : transformAnswers(repoQuestion.answers, repoQuestion.correctAnswer, includeRemovedAnswers)
  };
};

var updateResponse = function(success, message) {
  return {
    success : success,
    message : message
  };
};

var failResponse = function(message) {
  return updateResponse(false, message);
};


var repo = {

  getQuestions : function(limit, includeRemoved, callback) {
    client.scan({ TableName: QUESTION_TABLE }, function(err, data) {
      if (err) {
        console.log('fail response: ' + JSON.stringify(err, null, 2));
        callback(failResponse(err.message));
      } else if (!data || !data.Items || !data.Items.length) {
        console.log('not data...');
        console.log(data);
        callback([]);
      } else {
        var questions = [];
        var questionLimit = (limit && limit > 0) ? limit : data.Items.length;
        for (var i=0; i < questionLimit && i < data.Items.length; i++) {
          if (!data.Items[i].removed || includeRemoved) {
            questions.push(transformQuestion(data.Items[i], includeRemoved));
          }
        }
        callback(questions);
      }
    });
  },

  getQuestion : function(id, callback) {
    client.get({
        TableName: QUESTION_TABLE,
        Key: {
          id
        } 
      }, function(err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
            callback(failResponse(err.message));
        } else {
            callback(data.Item ? transformQuestion(data.Item) : null);
        }
      });
  },

  // TODO How do we de-dupe?
  addQuestion : function(difficulty, text, category, callback) {
    var question = newQuestion(text, difficulty, category);
    client.put({
        TableName: QUESTION_TABLE,
        Item: question
      }, function(err, data) {
      if (err) {
        console.log(JSON.stringify(err, null, 2));
        callback(failResponse(err.message));
      } else {  
        callback(question);
      }
    });
  },

  updateQuestion : function(questionId, text, difficulty, category, callback) {

    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET #txt = :text, difficulty = :difficulty, category = :category",
        ExpressionAttributeValues: { 
            ":text": text,
            ":difficulty": difficulty,
            ":category": category
        },
        ExpressionAttributeNames: {
          "#txt" : "text"
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          callback(updateResponse(true, 'Question ' + questionId + ' updated.'));
        }
      });
  },

  addAnswer : function(questionId, text, correct, pinned, callback) {

    var answer = newAnswer(text, pinned);
    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET answers.#answerId = :answer",
        ExpressionAttributeNames: {
            "#answerId" : answer.id          
        },
        ExpressionAttributeValues: { 
            ":answer" : answer
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          if (correct) {
            repo.markAnswerCorrect(questionId, answer.id, function(updateResult) {
              if (!updateResult.success) {
                console.log('Couldn\'t make answer ' + answer.id + ' correct because: ' + updateResult.message);
              }
            });
          }
          callback(answer);
        }
      });
  },

  updateAnswerText : function(questionId, answerId, text, callback) {

    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET answers.#answerId.#txt = :text",
        ExpressionAttributeNames: {
            "#answerId" : answerId,
            "#txt" : "text"
        },
        ExpressionAttributeValues: { 
            ":text" : text
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          callback(updateResponse(true, 'Updated text on answer ' + answerId + ' of question ' + questionId));
        }
      });
  },


  updateAnswerPin : function(questionId, answerId, pinned, callback) {
    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET answers.#answerId.pinned = :pinned",
        ExpressionAttributeNames: { 
            "#answerId" : answerId
        },
        ExpressionAttributeValues: { 
            ":pinned" : pinned
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          callback(updateResponse(true, 'Set pinned=' + pinned + ' on answer ' + answerId + ' of question ' + questionId));
        }
      });
  },

  pinAnswer : function(questionId, answerId, callback) {
    repo.updateAnswerPin(questionId, answerId, true, callback);
  },

  unpinAnswer : function(questionId, answerId, callback) {
    repo.updateAnswerPin(questionId, answerId, false, callback);
  },

  markAnswerCorrect : function(questionId, answerId, callback) {
    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET correctAnswer = :answerId",
        ExpressionAttributeValues: { 
            ":answerId" : answerId
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          callback(updateResponse(true, 'Marked answer ' + answerId + ' of Question ' + questionId + ' correct'));
        }
      });
  },

  updateAnswerRemoved : function(questionId, answerId, removed, callback) {
    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET answers.#answerId.removed = :removed",
        ExpressionAttributeNames: { 
            "#answerId" : answerId
        },
        ExpressionAttributeValues: { 
            ":removed" : removed
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          callback(updateResponse(true, 'Set removed= ' + removed + ' on answer ' + answerId + ' of Question ' + questionId));
        }
      });
  },

  removeAnswer : function(questionId, answerId, callback) {
    repo.updateAnswerRemoved(questionId, answerId, true, callback);
  },

  unremoveAnswer : function(questionId, answerId, callback) {
    repo.updateAnswerRemoved(questionId, answerId, false, callback);
  },

  updateQuestionRemoved : function(questionId, removed, callback) {
    client.update({
        TableName: QUESTION_TABLE,
        Key: {
            "id":questionId
        },
        UpdateExpression: "SET removed = :removed",
        ExpressionAttributeValues: { 
            ":removed" : removed
        },
        ReturnValues: "ALL_NEW"
      }, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err, null, 2));
          callback(failResponse(err.message));
        } else {
          // TODO: This may not work...might need to compose a new object
          callback(updateResponse(true, 'Question ' + questionId + ' removed'));
        }
      });
  },

  removeQuestion : function(questionId, callback) {
    repo.updateQuestionRemoved(questionId, true, callback);
  },

  unremoveQuestion : function(questionId, callback) {
    repo.updateQuestionRemoved(questionId, false, callback);
  }
};

module.exports = repo;