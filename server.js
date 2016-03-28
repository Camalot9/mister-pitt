'use strict';
const restify = require('restify');
const getQuestionsEndpoints = require('./handlers/questions/get');
const postQuestionsEndpoints = require('./handlers/questions/post');
const deleteQuestionsEndpoints = require('./handlers/questions/delete');
const putQuestionsEndpoints = require('./handlers/questions/put');

class MisterPitt {
	constructor() {
		var server = restify.createServer();
		server.use(restify.bodyParser({ mapParams: false }));

		// Questions Endpoints
		server.get('/admin/questions', getQuestionsEndpoints.allQuestions);
		server.get('/admin/questions/summary', getQuestionsEndpoints.questionsSummary);
		server.get('/admin/questions/:questionId', getQuestionsEndpoints.question);
		server.post('/admin/questions', postQuestionsEndpoints.addQuestion);
		server.post('/admin/questions/:questionId/answers', postQuestionsEndpoints.addAnswer);
		server.put('/admin/questions/:questionId', putQuestionsEndpoints.updateQuestion);
		server.put('/admin/questions/:questionId/removed', putQuestionsEndpoints.undeleteQuestion);
		server.put('/admin/questions/:questionId/answers/:answerId', putQuestionsEndpoints.updateAnswerText);
		server.put('/admin/questions/:questionId/answers/:answerId/pinned', putQuestionsEndpoints.pinAnswer);
		server.put('/admin/questions/:questionId/answers/:answerId/correct', putQuestionsEndpoints.updateAnswerCorrect);
		server.put('/admin/questions/:questionId/answers/:answerId/removed', putQuestionsEndpoints.undeleteAnswer);
		server.del('/admin/questions/:questionId', deleteQuestionsEndpoints.removeQuestion);
		server.del('/admin/questions/:questionId/answers/:answerId', deleteQuestionsEndpoints.removeAnswer);
		server.del('/admin/questions/:questionId/answers/:answerId/pinned', deleteQuestionsEndpoints.unpinAnswer);



		server.get(/\/pitt\/(css|js|fonts|build)\/?.*/, restify.serveStatic({
		  'directory': './public',
		  'default': 'index.html'
		}));

		server.get(/\/pitt\/?.*/, restify.serveStatic({
		  directory: __dirname,
		  file: 'index.html'
		}));

		server.on('uncaughtException', function (req, res, route, error) {
		  console.log(error);
		  res.send(500);
		});

		process.on('uncaughtException', function(err) {
		  console.log(err);
		  res.send(500);
		});

		server.listen(8080, function() {
		  console.log('%s listening at %s', server.name, server.url);
		});
	}
}
new MisterPitt();