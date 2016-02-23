var props = {
  'cassandra.keyspace' : 'sein',
  'cassandra.nodes' : [ 'localhost' ]
};

var config = {
  get : function(key, defaultValue) {
    return props[key] === undefined ? defaultValue : props[key];
  }
};

module.exports = config;