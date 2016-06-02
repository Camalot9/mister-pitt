var gameService = require('../../services/gameService');

var resp = function(success, message) {
	return {
		success: success,
		message: message
	};
};

var getHandlers = {
	getGame : function(req, res, next) {
		var gameId = req.params['gameId'];
		var game = gameService.getGame(gameId, function(game) {

			if (game) {
				console.log(game);
				res.send(200, game);
			} else {
				res.send(404, resp(false, 'Game not found. gameId=' + gameId));
			}

			next();

		});
	},

	getGameStatus : function(req, res, next) {
		gameService.getGameStatus(req.params.gameId, function(status) {
			if (!status) {
				res.send(404, resp(false, 'Game not found. gameId=' + req.params.gameId));
			} else {
				res.send(200, status);			
			}
			next();
		});
	},

	getJoinStatus : function(req, res, next) {
		var token = req.params['token'];
		gameService.getGameByToken(token, function(game, err) {
			if (err) {
				res.send(404, resp(false, 'Multiplayer token not found. token=' + token));
			} else {
				res.send(200, {
					joined : !!game,
					game : game
				});
			}
			next();
		});
	}
};

module.exports = getHandlers;
