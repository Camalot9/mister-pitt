var repo = require('../../data/questionsDynamoRepo');
var gameService = require('../../services/gameService');
var GameType = require('../../services/GameType');
var Difficulty = require('../../services/Difficulty');

var resp = function(success, message) {
	return {
		success : success,
		message : message
	};
};

var gamePostHandlers = {

	startSinglePlayer : function(req, res, next) {
		var body = req.body;
		if (!Difficulty[body.difficulty]) {
			res.send(400, resp(false, 'Difficulty not supported. difficulty=' + body.difficulty));
		} else {
			gameService.startSinglePlayer(body.profileId, Difficulty[body.difficulty], function(game) {
				res.send(200, game);
			});
		}
		next();
	},

	answerQuestion : function(req, res, next) {
		// Have to take duration as a param because we can't tell for sure when the question was asked. Just trust the client I guess.
		var correct = gameService.submitAnswer(req.params['gameId'], req.body.profileId, req.params.turn, req.body.answerId, req.body.duration);
		res.send(200, { correct : correct });
		next();
	},





	// UNDER CONSTRUCTION

	requestHeadToHead : function(req, res, next) {
		console.log('todo request head to head');
		res.send(419);
		next();
	},

	acceptHeadToHead : function(req, res, next) {
		console.log('todo accept head to head');
		res.send(419);
		next();
	},

	joinMultiplayer : function(req, res, next) {
		var body = req.body;
		if (!Difficulty[body.difficulty]) {
			res.send(400, resp(false, 'Difficulty not supported. difficulty=' + body.difficulty));
		} else {
			gameService.joinMultiplayer(body.profileId, Difficulty[body.difficulty], function(token) {
				res.send(200, { token: token });
			});
		}
		next();
	}


};

module.exports = gamePostHandlers;