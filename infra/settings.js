'use strict';

const
    db = require('./db'),
    Q = require('q');

let defered = Q.defer();

db.settings.findOne({},function(err, config){
    if(err) return defered.reject(err);
    defered.resolve(config);
});

module.exports = defered.promise;