var jsonHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

class Fetcher {
  getQuestions(limit, callback) {
    fetch('/admin/questions?limit=10')
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.log('There was a bad response');
        }
      })
      .then((json) => {
        callback(json);
      })
      .catch(() => {
        // TODO: Global way to display error messages.
      });
  }

  addQuestion(text, difficulty, category, callback) {
    fetch('/admin/questions', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        text: text,
        difficulty: difficulty
        //category: category
      })
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response posting question');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error creating a questions');
        console.log(e);
    });
  }

  addAnswer(text, correct, pinned, questionId, callback) {
    fetch('/admin/questions/' + questionId + '/answers', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        text: text,
        correct: correct,
        pinned: pinned
      })
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response posting answer');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error creating an answer');
        console.log(e);
    });
  }

  updateAnswer(answerId, questionId, text, callback) {
    fetch('/admin/questions/' + questionId + '/answers/' + answerId, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({
        text: text
      })
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response updating answer');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error updating an answer');
        console.log(e);
    });
  }

  updateAnswerCorrect(answerId, questionId, callback) {
    console.log('updating answer to correct');
    fetch('/admin/questions/' + questionId + '/answers/' + answerId + '/correct', {
      method: 'PUT',
      headers: jsonHeaders
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response updating answer correct');
      }
    })
    .then((json) => {
        console.log('got a positive response back for correct update');
        console.log(json);
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error updating an answer correct');
        console.log(e);
    });
  }

  pinAnswer(answerId, questionId, callback) {
    fetch('/admin/questions/' + questionId + '/answers/' + answerId + '/pinned', {
      method: 'PUT',
      headers: jsonHeaders
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response pinning answer');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error pinning an answer');
        console.log(e);
    });
  }

  unpinAnswer(answerId, questionId, callback) {
    fetch('/admin/questions/' + questionId + '/answers/' + answerId + '/pinned', {
      method: 'DELETE',
      headers: jsonHeaders
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response unpinning answer');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error unpinning an answer');
        console.log(e);
    });
  }

  deleteAnswer(answerId, questionId, callback) {
    fetch('/admin/questions/' + questionId + '/answers/' + answerId, {
      method: 'DELETE',
      headers: jsonHeaders
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response deleting answer');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error deleting an answer');
        console.log(e);
    });
  }

  deleteQuestion(questionId, callback) {
    fetch('/admin/questions/' + questionId, {
      method: 'DELETE',
      headers: jsonHeaders
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log('Bad response deleting question');
      }
    })
    .then((json) => {
        callback(json);
    })
    .catch((e) => {
        // TODO: Global way to display error messages.
        console.log('there was an error deleting a question');
        console.log(e);
    });
  }
}

export default new Fetcher();