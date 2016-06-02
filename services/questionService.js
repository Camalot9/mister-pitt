var questionRepo = require('../data/questionsDynamoRepo');

var MAX_MISSES = 200;
var DIFFICULTY_MAXIMUM = 10;
var MEDIUM_THRESHOLD = 7; //this and under is considered Medium or Easy
var EASY_THRESHOLD = 4; //this and under is considered Easy
var ANSWERS_NEEDED = 4;

var questionMap = {};
var allQuestions = [];
var mediumQuestions = [];
var easyQuestions = [];

var load = function() {
	console.log('Refreshing quesitons...');
	questionRepo.getQuestions(-1, false, function(questions) {
		if (!questions) {
			console.log('ERROR No questions found!');
		} else {
			var newAllQuestionsList = [];
			var newMediumQuestionsList = [];
			var newEasyQuestionsList = [];

			console.log('Found ' + questions.length + ' questions');
			questions.forEach(function(question) {
				questionMap[question.id] = question;
				newAllQuestionsList.push(question);
				if (question.difficulty <= MEDIUM_THRESHOLD) {
					newMediumQuestionsList.push(question);
				}
				if (question.difficulty <= EASY_THRESHOLD) {
					newEasyQuestionsList.push(question);
				}
			});
		}
	});
};

var findQuestionPool = function(difficultyLimit) {
	var pool;
	// It's weird but we need to cache a subset of questions 
	if (!difficultyLimit || difficultyLimit === DIFFICULTY_MAXIMUM) {
		pool = allQuestions;
	} else if (difficultyLimit == MEDIUM_THRESHOLD) {
		pool = mediumQuestions;
	} else if (difficultyLimit == EASY_THRESHOLD) {
		pool = easyQuestions;
	} else {
		console.log('ERROR unsupported difficulty setting. threshold=' + difficultyLimit);
		pool = easyQuestions;
	}
	return pool;
};

var calculatePointValue = function(difficulty) {
	return 1000 + (100 * difficulty);
};

var makeQuestionSet = function(questionList) {
	var set = {};
	if (questionList) {
		questionList.forEach(function(question) {
			set[question.id] = true;
		});
	}
	return set;
};

var chooseAnswers = function(allAnswers) {
	var selected = [];
	var pool = [];

	// Loop over every answer, pulling out the ones that HAVE to be included (and transforming them)
	for (var i=0; i < allAnswers.length; i++) {
		if (answer.correct || answer.pinned) {
			selected.push(transformAnswer(answer));
		}
		else {
			pool.push(answer);
		}
	}

	// Now fill in the remaining necessary answers with random selection that were left over
	while (selected.length < ANSWERS_NEEDED && pool.length > 0) {
		var chosenIndex = random(pool.length);
		selected.push(transformAnswer(pool[chosenIndex]));
		pool = pool.splice(chosenIndex, 1);
	}

	return shuffleAnswers(selected);
};

var transformQuestion = function(question) {
	return {
		id : question.id,
		category: question.category,
		value: calculatePointValue(question.difficulty),
		answers: chooseAnswers(question.answers)
	};
};

var transformAnswer = function(answer) {
	return {
		id: answer.id,
		text: answer.text
	};
};

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
var shuffleAnswers = function(answers) {
    for (var i = answers.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = answers[i];
        answers[i] = answers[j];
        answers[j] = temp;
    }
    return answers;
}

var random = function(max) {
    return Math.random() * max;
};

var blindGrab = function(pool, count, excludeList) {
	var start = Date.now();

	var excludeSet = makeQuestionSet(excludeList);

	var chosen = [];
	var misses = 0;
	while (chosen.length < count && misses < MAX_MISSES) {

		// TODO WHY IS THIS POOL ALWAYS EMPTY?
		// MAYBE I JUST DONT HAVE ENOUGH QUESTIONS?
		console.log('pool length: ' + pool.length);

		var question = pool[random(pool.length)];
		if (!excludeSet[question.id]) {
			chosen.push(transformQuestion(question));
		} else {
			misses++;
		}
	}

	if (!(chosen.length == count)) {
		console.log('ERROR couldn\'t find the requested number of questions. requested=' + count + ' found=' + chosen.length);
	}

	console.log('event=chooseQuestions method=blindGrab found=' + chosen.length + ' misses=' + misses + ' time=' + Date.now() - start);

	return chosen;
};

var questionService = {
	get : function(questionId) {
		return questionMap[questionId];
	},
	chooseQuestions : function(count, excludeList, difficultyLimit, callback) {
		var pool = findQuestionPool(difficultyLimit);
		callback(blindGrab(pool, count, excludeList));
	},

	// What is this used for? Should the questions be transformed?
	getQuestions : function(questionsToGet, callback) {
		var questions = [];
		for (var i=0; i < questionsToGet.length; i++) {
			questions.push(questionMap[questionsToGet[i]]);
		}
		callback(questions);
	}

};

load();

// TODO Set this to like...an hour?
setInterval(load, 10000);

module.exports = questionService;