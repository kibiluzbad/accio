'use strict';

const
    scheduler = require('../infra/scheduler'),
    log = require('npmlog'),
    util = require('util'),
    db = require('./../infra/db');

scheduler.define('add-to-torrent-client',{priority: 'high', concurrency: 1} , function(job, done) {
    let data = job.attrs.data;

    if(!data.provider) {
        job.fail('No torrrent provider');
        done();
        return;
    }

    let provider = require(util.format('./../torrent-clients/%s-provider',data.provider));

    log.info('add-to-torrent-client',data.magnetLink);
    provider.add(data.magnetLink,function(err,args){

        log.info('add-to-torrent-client',util.format('Torrent %s added.',args.name));
        if(err){
            log.error('add-to-torrent-client',err);
            job.fail(err.message);
        }else {
            db.torrents.update({_id: data.torrentId},{ $set:{status: 'downloading'}},function(err){
               if(err) log.error('add-to-torrent-client',err);

                let checkDownloadCompleted = agenda.create('check-download-completed', {ids: [args.id], torrentId: data.torrentId, provider: data.provider});
                checkDownloadCompleted.repeatEvery('1 minute');
                checkDownloadCompleted.save();
            });
        }
        done();
    });
});