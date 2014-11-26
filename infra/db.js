'use strict';

const
    Datastore = require('nedb'),
    path = require('path'),
    series = new Datastore({ filename: path.join(__dirname,'../.db/accio/series.db'), autoload: true }),
    torrents = new Datastore({ filename: path.join(__dirname,'../.db/accio/torrents.db'), autoload: true });

exports.series = series;
exports.torrents = torrents;



