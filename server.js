var restify = require('restify');
var getEndpoints = require('./handlers/get');

var server = restify.createServer();
server.get('/admin/questions', getEndpoints.allQuestions);
server.get('/admin/questions/:id', getEndpoints.question);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});