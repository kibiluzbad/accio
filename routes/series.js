'use strict';

const
    express = require('express'),
    router = express.Router(),
    request = require('request'),
    path = require('path'),
    db = require('./../infra/db.js'),
    scheduler = require('./../infra/scheduler.js'),
    util = require('util'),
    subdb = require('./../infra/subdb'),
    S = require('string'),
    settings = require('./../infra/settings');

router.get('/test',function(req,res){
    scheduler.now('rename-file',{"torrentId": "UC0vPjpomc3qCWtK", ids:[95], provider: 'transmission', path: "/mnt/downloads/Constantine.S01E01.Non.Est.Asylum.1080p.WEB-DL.DD5.1.H.264-ECI[rarbg]"});
    res.json({message:'scheduled'});
/*
    let pathToFile = '/mnt/series/Constantine/Season 01/Episode 05/Danse Vaudou.mkv';
    let language = 'pt';

    subdb.getHash(pathToFile).then(function(hash){
        console.log(hash);
        let pathToSub = path.join(path.dirname(pathToFile), path.basename(pathToFile, path.extname(pathToFile))) + '.srt';
        console.log(pathToSub);
        return subdb.download(hash,language,pathToSub);
    }).then(function(pathToSub){
        res.json(pathToSub);
    }).catch(function(err){
        res.status(500).json(err);
    });
*/
});

router.get('/', function (req, res) {
    db.find({}, function (err, docs) {
        if(err) res.status(500).json(err)
        else  res.json(docs);
    });
});

router.get('/search', function (req, res) {
    let url = 'http://www.omdbapi.com/?s='+ req.query.q;

    request(url,function (error, response, body) {
        function isSerie(item){
            return item.Type === 'series';
        }

        if (!error && response.statusCode == 200) {
          return res.json(JSON.parse(body).Search.filter(isSerie));
        }

        if(error) throw error;
    });

});

router.post('/add/:id', function (req, res) {
    let url = 'http://www.myapifilms.com/imdb?idIMDB='+req.params.id+'&format=JSON&aka=0&business=0&seasons=1&seasonYear=0&technical=0&lang=en-us&actors=N&biography=0&trailer=0&uniqueName=0&filmography=0&bornDied=0&starSign=0&actorActress=0&actorTrivia=0&movieTrivia=0&awards=0';
    console.log(url);
    request(url,function (error, response, body) {

        if (!error && response.statusCode == 200) {

            let serie = JSON.parse(body);
            console.log(serie);
            settings.then(function(config){
                db.series.insert(serie,function(err,doc){
                    if(err) return res.status(500).json(err);
                    if(!err && doc){

                        scheduler.now('create-folder-structure',{title: doc.title, seasons: doc.seasons, basePath: config.destinationPath});
                        return res.json(doc)
                    };
                });
            });


        }

        if(error) throw error;
    });

});

router.post('/schedule/:id',function(req,res){

    let id = req.params.id;

    db.series.findOne({ _id: id }, function (err, serie) {
        if(err) res.status(500).json(err);
        else if(serie) {
            serie.seasons.forEach(function(season){
               season.episodes.forEach(function(episode){
                   if(!episode.date) return;

                   let dateToRun = new Date(Date.parse(episode.date));
                   let data = {
                       serieId: serie._id,
                       serieName: serie.title,
                       episodeNum: S(episode.episode).padLeft(2,'0').s,
                       title: episode.title,
                       season:  S(season.numSeason).padLeft(2,'0').s
                   };

                   episode.status = 'Scheduled';

                   scheduler.schedule(dateToRun,'find-torrent',data);
               });
            });
            res.status(201).json({message: util.format('%s scheduled.',serie.title)});
        }else{
            res.status(404).json({message: util.format('%s not found, try to add it first ;)',id)});
        }
    });

});

module.exports = router;