'use strict';

const
    Q = require('q'),
    request = require('request'),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    crypto = require('crypto');

function download(hash, language, pathToDownload) {
    let defered = Q.defer();
    var options = {
        url: util.format('http://api.thesubdb.com/?action=download&hash=%s&language=%s', hash, language),
        headers: {
            'User-Agent': 'SubDB/1.0 (Pyrrot/0.1; http://github.com/jrhames/pyrrot-cli)'
        }
    };

    console.log(options);

    request(options, function (error, response, body) {
        if (error) return defered.reject(error);
        console.log(response.statusCode);
        if (200 === response.statusCode){
            let normalized = path.normalize(pathToDownload);

            return fs.writeFile(normalized,body,function(err){
                if (err) return defered.reject(err);

                return defered.resolve(normalized);
            });
        }
        defered.reject({message: 'Can\'t find sub'});
    });

    return defered.promise;
}

function getHash(pathToFile){
    let defered = Q.defer();

   console.log(pathToFile);
        var file_size = 0;
        var chunk_size = 65536;
        var buf = new Buffer(chunk_size*2);
        var b_read = 0;

        fs.stat(pathToFile, function(err, stat){
            if(err) return defered.reject(err);

            file_size = stat.size;
            console.log(file_size);

            fs.open(pathToFile, 'r', function(err, fd) {
                if(err) return defered.reject(err);
                console.log(fd);
                var t_offsets = [0, file_size-chunk_size];
                for(var i in t_offsets) {
                    b_read = fs.readSync(fd, buf, b_read, chunk_size, t_offsets[i]);
                }

                var md5sum = crypto.createHash('md5');
                md5sum.update(buf);
                var d = md5sum.digest('hex');
                console.log(d);
                defered.resolve(d);
            });
        });


    return defered.promise;
}

module.exports = {
    download: download,
    getHash: getHash
};