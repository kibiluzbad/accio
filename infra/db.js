'use strict';

const
    Datastore = require('nedb'),
    path = require('path'),
    db = new Datastore({ filename: path.join(__dirname,'../.db/accio'), autoload: true });

module.exports = db;



