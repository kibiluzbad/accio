'use strict';

const
    Transmission = require('transmission'),
    Q = require('q'),
    settings = require('./../infra/settings');

let defered = Q.defer();

settings.then(function(config){

    let transmission = new Transmission({
        host: config.torrent.host,
        port: config.torrent.port,
        username: config.torrent.username,
        password: config.torrent.password
    });

    defered.resolve({
        add: function(url,cb){ transmission.addUrl(url,cb);},
        get: function(ids,cb){ transmission.get(ids,cb);},
        remove: function(ids,cb){ transmission.remove(ids, true, cb);}
    });
}).catch(function(err){
   defered.reject(err);
});


module.exports = defered.promise;