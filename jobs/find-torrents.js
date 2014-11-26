'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    tpb = require('thepiratebay'),
    db = require('./../infra/db'),
    util = require('util');

scheduler.define('find-torrent',{priority: 'high', concurrency: 1}, function(job, done) {
    let doc = job.attrs.data;
    let query = util.format('%s s%se%s %s',doc.serieName,doc.season,doc.episodeNum,'1080p');
    log.info('find-torrent',query);
    tpb.search(query, {
        category: '208',
        orderBy: '7'
    }).then(function(results){
        //TODO: Get provider from user settings
        doc.torrents = results;
        doc.status = 'Scheduled';
        db.torrents.insert( doc,function(err, doc){
            if(err) {
                log.error('find-torrent',err);
                job.fail(err.message);
            }else
                scheduler.now('add-to-torrent-client',{provider: 'transmission', magnetLink: results[0].magnetLink, torrentId: doc._id});
            done();

        });
    }).catch(function(err){
        log.error('find-torrent',err);
        job.fail(err.message);
        done();
    });

});