var uuid = require('node-uuid');
var AWS = require('aws-sdk');

var PENDING_GAME_TABLE = 'pendingGames';
var GAME_TABLE = 'games';
var ANSWER_LOG_TABLE = 'answerLog';
var TURN_LOG_TABLE = 'turnLog';

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var client = new AWS.DynamoDB.DocumentClient({
  'httpOptions' : {
    'timeout' : 5000
  }
});

var PendingGameStatus = {
	SEARCHING : 'SEARCHING',
	JOINED : 'JOINED',
	ERROR : 'ERROR'
};

var failResponse = function(message) {
	return {
		success : false,
		error : true,
		message : message
	};
};

var successResponse = function(message) {
	return {
		success : true,
		error : false,
		message : message
	};
};

var transformGame = function(item) {
	console.log('TODO What should a game look like coming out of the repo?');
	return item;
};

var transformGameLog = function(gameLog) {
	console.log('TODO What should a game log look like coming out of the repo?');

	// Needs to return a non-null value
	return gameLog ? gameLog : [];
}


var repo = {


	getGame : function(gameId, callback) {
	    client.get({
	        TableName: GAME_TABLE,
	        Key: {
	          gameId
	        } 
	      }, function(err, data) {
	        if (err) {
	            console.log(JSON.stringify(err, null, 2));
	            callback(failResponse(err.message));
	        } else {
	            callback(data.Item ? transformGame(data.Item) : null);
	        }
	    });
	},

	saveTurn : function(turn, callback) {
	    client.put({
	        TableName: TURN_LOG_TABLE,
	        Item: turn
	      }, function(err, data) {
			if (err) {
				console.log(JSON.stringify(err, null, 2));
				callback(failResponse(err.message));
			} else {  
				callback(successResponse('Inserted turn. turnNumber=' + turn.number + ' gameId=' + turn.gameId));
			}
	    });
	},

	getAnswerLog : function(gameId, turn, callback) {
		// TODO how to limit this to just a single turn?
	    client.query({
	        TableName: ANSWER_LOG_TABLE,
	        Key: {
	          gameId
	        } 
	      }, function(err, data) {
	        if (err) {
	            console.log(JSON.stringify(err, null, 2));
	            callback(failResponse(err.message));
	        } else {
	        	// TODO Does data.Item come back from query as an array or what?
	            callback(data.Item);
	        }
	    });
	},

	getGameLog : function(gameId, callback) {
	    client.query({
	        TableName: TURN_LOG_TABLE,
	        Key: {
	          gameId
	        } 
	      }, function(err, data) {
	        if (err) {
	            console.log(JSON.stringify(err, null, 2));
	            callback(failResponse(err.message));
	        } else {
	        	// TODO Does data.Item come back from query as an array or what?
	            callback(transformGameLog(data.Item));
	        }
	    });
	},

	// TODO THIS SHOULD JUST TAKE A SINGLE ANSWER ARG
	logAnswer : function(answerLogId, profileId, gameId, turn, questionId, answerId, correct, duration, callback) {
		var entry = {
			answerLogId : answerLogId,
			profileId : profileId,
			gameId : gameId,
			questionId : questionId,
			turn : turn,
			questionId : questionId,
			answerId : answerId,
			correct : correct,
			duration : duration
		};

	    client.put({
	        TableName: ANSWER_LOG_TABLE,
	        Item: entry
	      }, function(err, data) {
			if (err) {
				console.log(JSON.stringify(err, null, 2));
				callback(failResponse(err.message));
			} else {  
				callback(successResponse('Inserted answer entry ' + answerLogId));
			}
	    });
	},

	/**
	 * Request a multiplayer game.
	 */
	requestEntry : function(callback) {
		var token = uuid.v4();
	    client.put({
	        TableName: PENDING_GAME_TABLE,
	        Item: {
	        	token: token,
	        	status: PendingGameStatus.SEARCHING
	        }
	      }, function(err, data) {
		      if (err) {
		        console.log(JSON.stringify(err, null, 2));
		        callback(failResponse(err.message));
		      } else {  
		        callback(token);
		      }
	    });
	},

	updatePendingGameStatus : function(token, status, gameId, callback) {
		client.update({
				TableName: PENDING_GAME_TABLE,
				Key: {
					token : token
				},
				UpdateExpression: 'SET status = :status, gameId = :gameId',
		        ExpressionAttributeValues: { 
		            ":status": status,
		            ":gameId": gameId
	        	}
	        }, function(err, data) {
		        if (err) {
		          console.log(JSON.stringify(err, null, 2));
		          callback(failResponse(err.message));
		        } else {
		          callback(successResponse('Updated pending game. token=' + token + ' gameId=' + gameId));
		        }
	      	});
	},

	/**
	 * Get the status of a multiplayer request.
	 * Callback gets the gameId as a param once the game is assigned.
	 */
	getPendingGameStatus : function(token, callback) {
	    client.get({
	        TableName: PENDING_GAME_TABLE,
	        Key: {
	          token
	        } 
	      }, function(err, data) {
	        if (err) {
	            console.log(JSON.stringify(err, null, 2));
	            callback(failResponse(err.message));
	        } else {
	        	var info = data.Item;
	        	if (info.status === PendingGameStatus.ERROR) {
	        		callback(failResponse('Pending game errored out during the search phase'));
	        	} else if (info.status == PendingGameStatus.JOINED) {
	        		if (!info.gameId) {
	        			callback(failResponse('Game search ended but no game was found'));
	        		} else {
	        			callback(info.gameId);
	        		}
	        	}
	        }
	    });
	},

	createGame : function(game, callback) {
		/*
		A game looks like:
			{
				gameId: gameId,
				players : players,
				currentTime : now,  // Not included for single player
				startTime : gameStart, // Not included for single player
				turns: []
			};
		*/


		// Note: This call has to fail if the game already exists or bad things will happen. Does put?
	    client.put({
	        TableName: GAME_TABLE,
	        Item: game
	      }, function(err, data) {
		      if (err) {
		        console.log(JSON.stringify(err, null, 2));
		        callback(failResponse(err.message));
		      } else {  
		        callback(successResponse('Created game ' + game.gameId));
		      }
	    });
	}
};

module.exports = repo;