'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    S = require('string'),
    async = require('async');

scheduler.define('create-folder-structure', {priority: 'high', concurrency: 1}, function (job, done) {
    let data = job.attrs.data;

    log.info('create-folder-structure', 'Creating structure for %s', data.title);

    let tasks = [];

    tasks.push(function (next) {
        fs.mkdir(path.join(data.basePath, data.title), next);
    });

    data.seasons.forEach(function (season) {
        tasks.push(function (next) {
            fs.mkdir(path.join(data.basePath, data.title, util.format('Season %s', S(season.numSeason).padLeft(2, '0').s)), next);
        });
    });

    async.waterfall(tasks,
        function (err) {
            if (err) {
                log.error('create-folder-structure', err)
                job.fail(err.message);
            }
            done();
        });

});

