var config = require('../config/config');
var uuid = require('node-uuid');
var async = require('async');
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var ANSWER_LOG_TABLE = 'answerLog';
var PROFILE_TABLE = 'profiles';

var client = new AWS.DynamoDB.DocumentClient({
  'httpOptions' : {
    'timeout' : 5000
  }
});

var newProfile = function(deviceIdentifier) {
	return {
		deviceIdentifier: deviceIdentifier,
		profileId: '' + uuid.v4()
	};
};

var newAnswerEntry = function(answerLogId, profileId, questionId, answerId, correct) {
	return {
		answerLogId: answerLogId,
		profileId: profileId,
		questionId: questionId,
		answerId: answerId,
		correct: correct,
		answeredTimestamp: Date.now()
	};
};

var updateResponse = function(success, message, code) {
	return {
		success : success,
		error : !success,
		message : message,
		code : code
	};
};

var repo = {


	createAccount : function(deviceIdentifier, callback) {
		repo.getAccount(deviceIdentifier, function(response) {
			if (response.error === true) {
				callback(updateResponse(false, 'Database error retreiving account info: ' + response.message, 'DATASOURCE_ERROR'));
			} else if (response) {
				callback(updateResponse(false, 'Account ' + deviceIdentifier + ' is already registered.', 'ACCOUNT_EXISTS'));
			} else {
				var profile = newProfile(deviceIdentifier);
			    client.put({
			        TableName: PROFILE_TABLE,
			        Item: profile
			      }, function(err, data) {
					if (err) {
						console.log(JSON.stringify(err, null, 2));
						callback(updateResponse(false, err.message));
					} else {  
						callback(profile);
					}
			    });
			}
		});
	},

	getAccount : function(deviceIdentifier, callback) {
		var params = {
		    TableName: PROFILE_TABLE,
		    Key: { 
		        deviceIdentifier : deviceIdentifier, 
		    }
		};
		client.get(params, function(err, data) {
		    if (err) {
		    	console.log(err);
		    	callback(updateResponse(false, err.message));
		    } else {
		    	// TODO: Is this how this works?
		    	callback(data.Items ? data.Items[0] : null);
		    }
		});
	},

	insertAnswerEntry : function(answerLogId, profileId, questionId, answerId, correct, callback) {
	    var entry = newQuestion(answerLogId, profileId, questionId, answerId, correct);
	    client.put({
	        TableName: ANSWER_LOG_TABLE,
	        Item: entry
	      }, function(err, data) {
			if (err) {
				console.log(JSON.stringify(err, null, 2));
				callback(updateResponse(false, err.message));
			} else {  
				callback(updateResponse(true, 'Inserted answer entry ' + answerLogId));
			}
	    });
	},

	getAllQuestionsAsked : function(profileId, callback) {
		var params = {
		    TableName: 'answerLog',
		    IndexName: 'questionsAskedByProfile', // optional (if querying an index)
		    KeyConditionExpression: 'profileId = :profileId',
		    ExpressionAttributeValues: { // a map of substitutions for all attribute values
		      ':profileId': profileId
		    }
		};

		client.query(params, function(err, data) {
		    if (err) {
		    	console.log(err);
		    	callback(updateResponse(false, err.message));
		    } else {
		    	var answerIds = [];
		    	var answers = data.Items ? data.Items : [];
		    	answers.forEach(function(answer) {
		    		answerIds.push(answer.id);
		    	});
		    	callback(answerIds);
		    }
		});

	}
};

module.exports = repo;