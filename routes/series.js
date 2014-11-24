'use strict';

const
    express = require('express'),
    router = express.Router(),
    request = require('request'),
    tpb = require('thepiratebay'),
    db = require('./../infra/db.js');

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

    request(url,function (error, response, body) {

        if (!error && response.statusCode == 200) {

            let serie = JSON.parse(body);
            db.insert(serie,function(err,doc){
                if(err) return res.status(500).json(err);
                if(!err && doc) return res.json(doc);
            });

        }

        if(error) throw error;
    });

});

router.get('/find-torrent/:id',function(req,res){

    db.findOne({ _id: req.params.id }, function (err, doc) {
        if(err) res.status(500).json(err);
        else if(doc) {
            tpb.search(doc.title + ' 1080p', {
                category: '208',
                orderBy: '7'
            }).then(function(results){
                res.json(results);
            }).catch(function(err){
                res.status(500).json(err);
            });
        }
    });
    //GSKbkLXBssUSykxc


});

module.exports = router;