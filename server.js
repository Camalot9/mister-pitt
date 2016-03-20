'use strict';
const restify = require('restify');
const getEndpoints = require('./handlers/get');
const postEndpoints = require('./handlers/post');
const deleteEndpoints = require('./handlers/delete');
const putEndpoints = require('./handlers/put');

class MisterPitt {
	constructor() {
		var server = restify.createServer();
		server.use(restify.bodyParser({ mapParams: false }));
		server.get('/admin/questions', getEndpoints.allQuestions);
		server.get('/admin/questions/summary', getEndpoints.questionsSummary);
		server.get('/admin/questions/:questionId', getEndpoints.question);
		server.post('/admin/questions', postEndpoints.addQuestion);
		server.post('/admin/questions/:questionId/answers', postEndpoints.addAnswer);
		server.put('/admin/questions/:questionId', putEndpoints.updateQuestion);
		server.put('/admin/questions/:questionId/answers/:answerId', putEndpoints.updateAnswerText);
		server.put('/admin/questions/:questionId/answers/:answerId/pinned', putEndpoints.pinAnswer);
		server.put('/admin/questions/:questionId/answers/:answerId/correct', putEndpoints.updateAnswerCorrect);
		server.del('/admin/questions/:questionId', deleteEndpoints.removeQuestion);
		server.del('/admin/questions/:questionId/answers/:answerId', deleteEndpoints.removeAnswer);
		server.del('/admin/questions/:questionId/answers/:answerId/pinned', deleteEndpoints.unpinAnswer);

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