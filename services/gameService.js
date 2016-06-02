var uuid = require('node-uuid');
var gameRepo = require('../data/gameDynamoRepo');
var questionService = require('./questionService');
var Difficulty = require('./Difficulty');

// Why it complains about profile repo??
var profileRepo = require('../data/profileDynamoRepo');

// TODO Okay we obviously need a config for each game type. 1-on-1 is going to be a 24 hour turn time, for instance. See GameType.js?
var MULTIPLAYER_QUESTION_COUNT = 10;
var GAME_INIT_TIME = 15000; // 15 seconds from when the game is initialized to when the first turn starts
var TURN_TIME = 15000; // Each turn lasts 15 seconds
var TURN_BUFFER_TIME = 10000; // 10 seconds between each turn

var calculatePointValue = function(difficulty) {
	return 1000 + (100 * difficulty);
};

var bonusPoints = function(answer, pointValue) {
	var multiplier;
	if (!answer || !answer.correct) {
		multiplier = 0;
	} else if (answer.duration < 3000) {
		multiplier = 0.25;
	} else if (answer.duration < 6000) {
		multiplier = 0.1;
	} else {
		multiplier = 0;
	}

	return pointValue * multiplier;
};

var makeGame = function(props, questionList) {
	console.log('TODO What else should be in a game object?');
	return {
		id: props.id,
		questions: quesitonList
	};
};

var transformPlayerTurn = function(profileId, answerEntries) {
	var answer = findAnswer(profileId, pointValue, answerEntries);
	if (!answer) {
		answer = {
			answerId : null,
			correct : false
		};
	}

	var basePoints = answer.correct ? pointValue : 0;
	var bonusPoints = bonusPoints(answer, pointValue);
	return {
		profileId : profileId,
		correct : answer.correct,
		answerId : answer.answerId,
		basePoints : basePoints,
		bonusPoints : bonusPoints,
		totalPoints : basePoints + bonusPoints
	};
};

var gameService = {


	startSinglePlayer : function(profileId, difficulty, callback) {

		profileRepo.getAllQuestionsAsked(profileId, function(askedQuestions) {
			// TODO How should I resolve the number of questions? Do I need to grab the whole game?
			var questions = questionService.chooseQuestions(10, askedQuestions, difficulty.limit);

			var game = {
				gameId: gameId,
				players : players,
				turns: []
			};

			for (var i=0; i < questions.length; i++) {
				game.turns.push({
					number : i + 1,
					pointValue : calculatePointValue(questions[i].difficulty),
					question : questions[i]
				});
			}

			repo.createGame(game, function(result) {
				callback(result);
			});

			/*
			Questions look like:
				{
					id,
					category,
					value,
					answers: {
						id,
						text
					}
				}
			*/	

			gameRepo.createSinglePlayerGame(profileId, difficulty, gameQuestions, function(game) {
				callback(makeGame(game, gameQuestions));
			});			
		});

	},

	getGame : function(gameId, callback) {
		gameRepo.getGame(gameId, function(repoGame) {
			if (repoGame) {
				questionService.getQuestions(repoGame.questions, function(questions) {
					callback(makeGame(repoGame, questions));
				});
			} else {
				callback(null);
			}
		});
	},

	// This will get triggered asynchonously, either by a timer or by picking up a message on an SQS queue
	// Grab everything for the given turn from the answer log, tabulate the results (including bonus points) and save to the turnLog table
	composeTurnOutcome : function(gameId, turn, callback) {
		gameRepo.getGame(gameId, function(repoGame) {
			var question = repoGame.questions[turn - 1];
			var turnOutcome = {
				gameId : gameId,
				turnNumber : turn,
				questionId : question.questionId,
				players : {}
				// Anything else we need here? Maybe calculate the milliseconds til the next question starts/ends?
			};

			if (repoGame) {
				gameRepo.getAnswerLog(gameId, turn, function(answerEntries) {
					
					game.players.forEach(function(profileId) {
						turnOutcome[profileId] = transformPlayerTurn(profileId, question.pointValue, answerEntries);
					});

					gameRepo.saveTurn(turnOutcome, callback);
				});
			} else {
				callback(null);
			}
		});
	},

	getGameStatus : function(gameId, callback) {
		console.log('TODO Implement game status');


		// First get the game itself to make sure it's legit. It may have predefined answerId's for each question?

		// Then call gameRepo.getTurnLog() and piece together the state.

		// HERE'S A QUESTION: DO WE NEED TO CHECK IF THE CURRENT TURN IS OVER AND MAKE SOME DETERMINATION ABOUT SCORE?
		// HERE'S THE ANSWER: Yes, the game itself has a turn object defined for each turn, including the start and end time
		// So first update this code that loops over all the answered questions and fill in the blanks for missing answers
		// if we're past the end time for a question.
		// Next we still need to figure out how to calculate the score. Hmm...
		// Okay here's the answer to that. We'll schedule the calculation 
		// 		- either with setTimeout (which we'd have to figure out what to do if a server gets restarted)
		// 		- or with putting messages on the SQS queue with a visibility delay...but it'd have to be fast!

		gameRepo.getGame(gameId, function(game) {
			if (game && !game.error) {
				var gameLog = {
					gameId : gameId,
					players : {}
				};

				var playerMap = {};
				// Initialize each player
				game.players.forEach(function(profileId) {
					playerMap[profileId] = [];
				});

				gameRepo.getGameLog(gameId, function(turns) {
					turns.forEach(function (turnEntry) {

						// BEFORE WE GO FURTHER, WE NEED TO FIGURE OUT WHAT THE GAMELOG ENTRIES LOOK LIKE


						// Produce a map of profileId's to an ordered list of answerLog entries by turn number...hopefully?
						// turn here HAS to be an integer or we'll end up with a map!
						playerMap[turnEntry.profileId][turnEntry.turn] = turnEntry;
					});

					// Note that each list of answers is in order by turn
					// Add up all the answers, divide by the number of players to get the current turn
					// See if the modulus of the total comes to 0 to find out if the current turn is over 


					// TODO Update all this logic because now the `game` object has start and end times for each turn...
					// ...we can actually tell if we're in the middle of a turn now.
					var answerTotal = 0;
					var profileIds = Object.keys(playerMap);
					for (var i=0; i < players.length; i++) {
						var playerAnswers = playerMap[profileIds[i]];
						var turns = [];
						var playerScore = 0;
						for (var j=0; j < playerAnswers.length; j++) {
							answerTotal++;
							var playerAnswer = playerAnswers[j];

							// do some transformation on the turn and add it to `turns`
							turns.push({
								turnNumber: j,
								scoreBefore: 0,
								correct: true,
								elapsedTime: 9000,
								answerPoints: 100,
								bonusPoints: 200,
								answerId: 'XYZ'
								// What all should go here
							});
						}

						// Here's the payoff. Save this turn list for each player
						gameLog.players[profileIds[i]].turns = turns;
					}
				});
			} else {
				callback(null);
			}
		});

		/*
			Something lke this...?
			{
				currentTurn: null,
				nextTurn: 3,
				players : {
					'xyz' : {
						score : 9000,
						turns : [
							{
								scoreBefore: 0,
								correct: true,
								elapsedTime: 8500,
								answerPoints: 100,
								bonusPoints: 0,
								answerId: 'abc'
							}
						]
					}
				}
			}




		*/
	},


	// So this is going to be called by the thing processing the SQS messages. Just returns success or failure.
	startMultiplayer : function(gameId, players, difficulty, callback) {
		// Choose the questions based on the profile of all players, and the difficulty
		var alreadyAsked = [];
		players.forEach(function(playerQuestions) {
			if (playerQuestions.error) {
				console.log('Error getting list of asked questions: ' + playerQuestions.message);
			} else {
				// I read this works somewhere
				alreadyAsked.push.apply(alreadyAsked, playerQuestions);
			}
		});

		questionService.chooseQuestions(MULTIPLAYER_QUESTION_COUNT, alreadyAsked, difficulty.limit, function(questions) {
			if (!questions || !questions.length === MULTIPLAYER_QUESTION_COUNT) {
				console.log('Error: Not enough questions chosen. questions=' + questions);
			}

			var now = Date.now();
			var gameStart = now + GAME_INIT_TIME;

			var game = {
				gameId: gameId,
				players : players,
				currentTime : now,
				startTime : gameStart,
				turns: []
			};

			var runningTime = gameStart;
			for (var i=0; i < questions.length; i++) {
				game.turns.push({
					number : i + 1,
					startTime : runningTime,
					endTime : runningTime + TURN_TIME,
					pointValue : calculatePointValue(questions[i].difficulty),
					question : questions[i]
				});
				runningTime += (TURN_TIME + TURN_BUFFER_TIME);
			}

			repo.createGame(game, function(result) {
				callback(result);
			});
		});
	},

	joinMultiplayer : function(profileId, difficulty, callback) {
		gameRepo.requestEntry(function(token) {
			console.log('todo make multiplayer game go into sqs. token=' + token);
			callback(token);
		});
	},

	getGameByToken : function(token, callback) {
		gameRepo.getPendingGameStatus(token, function(pendingGame) {
			if (!pendingGame) {
				callback(null, true); // err is the second param
			} else if (pendingGame.error) {
				console.log('ERROR getting pending game status. message=' + pendingGame.message);
				callback(null, true); // err is the second param
			} else {
				gameService.getGame(pendingGame, function(game) {
					callback(game, false);
				});
			}
		});
	},

	submitAnswer : function(gameId, profileId, turn, answerId, duration) {
		console.log('TODO How do we mark a single user answering a question');
		/*
			
			First figure out whether they answered the question correctly, by asking questionService

			put it in the ANSWER LOG!


		*/
	}

};

module.exports = gameService;