'use strict';

const
    express = require('express'),
    router = express.Router();

router.get('/', function (req, res) {
    res.sendfile('./public/app/index.html');
});

module.exports = router;