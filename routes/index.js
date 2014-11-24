'use strict';

const
    express = require('express'),
    router = express.Router();

router.get('/', function (req, res) {
    let pack = require('./../package.json');
    res.json({message: 'I\'m alive! :)',version: pack.version, name: pack.name});
});

module.exports = router;