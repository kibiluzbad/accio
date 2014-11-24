'use strict';

const
    express = require('express'),
    log = require('npmlog'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    favicon = require('serve-favicon'),
    app = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());

app.use(require('./routes/index.js'));
app.use('/series',require('./routes/series.js'));

app.use(logErrors);
app.use(clientErrorHandler);

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'),function () {

    var host = server.address().address
    var port = server.address().port

    log.info('serverapp','Accio listening at http://%s:%s', host, port)

});

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