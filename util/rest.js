var rest = {
  pre : function (statement, errorMessage) {
    if (statement !== true) {
      throw new Error(errorMessage);
    }
  }
};

module.exports = rest;