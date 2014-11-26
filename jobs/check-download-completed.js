'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    util = require('util'),
    db = require('./../infra/db');

scheduler.define('check-download-completed',{concurrency: 20} , function(job, done) {
    let data = job.attrs.data;

    if(!data.provider) {
        job.fail('No torrrent provider');
        done();
        return;
    }

    let provider = require(util.format('./../torrent-clients/%s-provider',data.provider));

    provider.get(data.ids,function(err,args){
        db.settings.findOne(function(err,config){
            log.info('check-download-completed',util.format('Check torrent %s, percent done %s %',data.ids[0],Math.ceil(args.torrents[0].percentDone * 100)));
            if(err){
                log.error('check-download-completed',err);
                job.fail(err.message);
            }else if(-1 !== [5,6].indexOf(args.torrents[0].status)) {

                job.remove(function(err) {
                    if(!err)log.info('check-download-completed',"Successfully removed job from collection");
                    else log.error('check-download-completed',err);
                });

                db.torrents.update({_id: data.torrentId},{ $set:{status: 'downloaded'}},function(err){
                    if(err) log.error('check-download-completed',err);

                    provider.remove(data.ids,function(err){
                        err ? log.error('check-download-completed', err) :log.info('check-download-completed', util.format('Torrent %s removed',data.ids[0]));
                    });

                    scheduler.now('rename-file',{torrentId: data.torrentId, path: path.join(config.downloadDir, args.torrents[0].name)});
                });
            }
            done();
        });
    });
});