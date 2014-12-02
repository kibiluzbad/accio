'use strict';

const
    express = require('express'),
    log = require('npmlog'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    favicon = require('serve-favicon'),
    app = express(),
    agendaUI = require('agenda-ui'),
    scheduler = require('./infra/scheduler');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public/app'));
app.use('/bower_components',express.static(__dirname + '/public/bower_components'));
app.use(logger('dev'));
app.use(bodyParser.json());

app.use(require('./routes/index.js'));
app.use('/series',require('./routes/series.js'));
app.use('/agenda-ui', agendaUI(scheduler, {poll: 5000}));

app.use(logErrors);
app.use(clientErrorHandler);

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'),function () {

    var host = server.address().address
    var port = server.address().port

    log.info('serverapp','Accio listening at http://%s:%s', host, port)

});

//TODO: Create worker file for jobs
require('./jobs/add-to-torrent-client');
require('./jobs/find-torrents');
require('./jobs/check-download-completed');
require('./jobs/rename-file');
require('./jobs/create-folder-structure');

scheduler.start();

scheduler.on('start', function(job) {
    //log.info('agenda',"Job %s starting", job.attrs.name);
});

scheduler.on('complete', function(job) {
    //log.info('agenda',"Job %s finished", job.attrs.name);
});

scheduler.on('success', function(job) {
    //log.info('agenda',"%s executed with success", job.attrs.name);
});

scheduler.on('fail', function(err, job) {
    //log.info('agenda',"Job %s with error: %s", job.attrs.name, err.message);
});


function graceful() {
    scheduler.stop(function() {
        process.exit(0);
    });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something blew up!' });
    } else {
        next(err);
    }
}

module.exports = app;