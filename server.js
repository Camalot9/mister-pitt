var restify = require('restify');
var getEndpoints = require('./handlers/get');
var postEndpoints = require('./handlers/post');

var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));
server.get('/admin/questions', getEndpoints.allQuestions);
server.get('/admin/questions/:questionId', getEndpoints.question);
server.post('/admin/questions', postEndpoints.addQuestion);
server.post('/admin/questions/:questionId/answers', postEndpoints.addAnswer);

server.on('uncaughtException', function (req, res, route, error) {
  console.log(error);
});

process.on('uncaughtException', function(err) {
  console.log(err);
});

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});