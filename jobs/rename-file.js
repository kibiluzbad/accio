'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    subdb = require('./../infra/subdb'),
    async = require('async'),
    readDir = require('readdir'),
    path = require('path'),
    fs = require('fs'),
    S = require('string'),
    db = require('./../infra/db'),
    ncp = require('ncp').ncp,
    util = require('util'),
    settings = require('./../infra/settings');

scheduler.define('rename-file',{priority: 'high', concurrency: 10}, function(job, done) {
    let data = job.attrs.data;
    let config={};

    if(!data.provider) {
        job.fail('No torrrent provider');
        done();
        return;
    }

    log.info('rename-file','Renaming %s',data.path);

    let provider = require(util.format('./../torrent-clients/%s-provider',data.provider));

    async.waterfall([
            function(next){
                settings.then(function(doc){
                    config = doc;
                    next();
                });
            },
            function(next){
                db.torrents.findOne({_id: data.torrentId},next)
            },
            function(torrent,next) {
                readDir.read(path.normalize(data.path),['*.mp4','*.mov','*.mkv','*.avi'],function(err, files){
                    //TODO: Throw error if files is null or empty
                    //TODO: If find more than one file get the largest
                    next(err,torrent,path.join(data.path,files[0]));
                })
            },
            function(torrent, moviePath,next){

                subdb.getHash(moviePath).then(function(hash) {
                    next(null,torrent,hash, moviePath);
                }).catch(function(err){
                    if(err){
                        log.error('rename-file', err);
                    }
                    next(err);
                });
            },
            function(torrent,hash, moviePath,next){
                let name = torrent.title.replace('.','');
                let subPath = path.join(data.path,util.format('%s.srt',name));

                console.log(name);
                console.log(hash);
                console.log(subPath);
                console.log(config.defaultLanguage);

                subdb.download(hash,config.defaultLanguage,subPath).then(function(pathToSub){
                    console.log(pathToSub);
                    next(null,torrent,moviePath);
                }).catch(function(err){
                    log.error('rename-filegit stat',err);
                    next(null,torrent,moviePath);
                });
            },
            function(torrent,moviePath,next) {
                let name = torrent.title.replace('.','');
                console.log(name);
                let newName=util.format('%s%s',name,path.extname(moviePath));
                let dir = path.dirname(moviePath);
                let newPath = path.join(dir,newName);

                fs.rename(moviePath, newPath,function(err){
                    next(err,torrent);
                });
            },
            function(torrent,next) {
                let episode= util.format('Episode %s',S(torrent.episodeNum).padLeft(2,'0').s);
                let filePath = path.join(config.destinationPath, torrent.serieName,'Season ' + torrent.season,episode);
                fs.mkdir(filePath,function(err){
                    next(err, filePath);
                });
            },
            function(newPath,next) {
                ncp(data.path,newPath,next);
            },
            function(next){
                provider.remove(data.ids,function(err){
                    err ? log.error('rename-file', err) :log.info('rename-file', util.format('Torrent %s removed',data.ids[0]));
                    next(err);
                });
            }
        ],
        function(err){
            if(err) {
                log.error('rename-file',err);
                job.fail(err.message);
            }
            if(!err) {
                log.info('rename-file', '%s renamed', data.path);
            };
            done();
        });
});