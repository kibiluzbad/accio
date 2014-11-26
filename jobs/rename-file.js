'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    SubDb = require('subdb'),
    async = require('async'),
    readDir = require('readdir'),
    fs = require('fs'),
    S = require('string'),
    db = require('./../infra/db'),
    ncp = require('ncp').ncp,
    util = require('util');

scheduler.define('rename-file',{priority: 'high', concurrency: 10}, function(job, done) {
    let data = job.attrs.data;
    let config={};

    log.info('rename-file','Renaming ');

    let subdb = new SubDb();

    async.waterfall([
            function(next){
                db.settings.findOne(function(err,doc){
                    config = doc;
                    next(err);
                });
            },
            function(next){
                db.torrents.findOne({_id: data.torrentId},next)
            },
            function(torrent,next) {
                readDir.read(data.path,['*.mp4','*.mov','*.mkv','*.avi'],function(err, files){
                    //TODO: Throw error if files is null or empty
                    //TODO: If find more than one file get the largest
                    next(err,torrent,files[0])
                })
            },
            function(torrent, moviePath,next){

                subdb.computeHash(moviePath, function(err, hash) {
                    if(err){
                        log.error('rename-file', err);
                    }

                    next(null,torrent,hash, moviePath);
                });
            },
            function(torrent,hash, moviePath,next){
                subdb.download_subtitle(hash,config.defaultLanguage,path.join(data.path,util.format('%s.src',torrent.title)),function(err, res){
                    next(err,torrent,moviePath);
                });
            },
            function(torrent,moviePath,next) {
                let newName=util.format('%s.%s',torrent.title,path.extname(moviePath));
                let dir = path.dirname(moviePath);
                let newPath = path.join(dir,newName);

                fs.rename(moviePath, newPath,function(err){
                    next(err,torrent);
                });
            },
            function(torrent,next) {
                let episode= util.format('Episode %s',S(torrent.episodeNum).padLeft(2,'0').s);
                let path = path.join(config.destinationPath.path, torrent.serieName,episode);
                fs.mkdir(path,function(err){
                    next(err, path);
                });
            },
            function(newPath,next) {
                ncp(data.path,newPath,next);
            }
        ],
        function(err){
            if(err) {
                log.error('rename-file',err);
                job.fail(err.message);
            }
            done();
        });
});