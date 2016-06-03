var profileRepo = require('../../data/profileDynamoRepo');
var rest = require('../../util/rest');

var post = {
  // Was this moved to the game handler?
  answered : function(req, res, next) {
    var answer = req.body;
    var profileId = req.params.profileId;

    console.log(answer);

    // HEY GET THE CORRECT ANSWER FROM SOME KINDA CACHE?
    var correct = true;

    profileRepo.insertAnswerEntry(answer['answerLogId'], profileId, answer['questionId'], answer['answerId'], correct, function(result) {
      
      // TODO PUT TOGETHER A RESPONSE OBJECT TELLING WHETHER THE ANSWER WAS CORRECT

      res.send(201, result);
    });

    next();
  },

  createProfile : function(req, res, next) {
    var deviceId = req.body.deviceId;
    profileRepo.createAccount(deviceId, function(profile) {
      if (profile.error) {
        res.send(400, profile);
      }
      else {
        res.send(201, profile);
      }
      next();
    });
  }
};

module.exports = post;