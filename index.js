/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Copyright 2014 Matthew Jaquish <mattjaq at yahoo dot com>
Licensed under the Apache License, Version 2.0
http://www.apache.org/licenses/LICENSE-2.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * Creates new renamed files based on an asset digest JSON file.
 */

'use strict';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Dependencies
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var fs = require('fs');
var path = require('path');
var async = require('async');
var Promise = require('rsvp').Promise;
var Writer = require('broccoli-writer');
var mkpath = require('mkpath');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Util functions
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function msg(txt) {
    console.log('>>> ' + txt);
}

// Copy a file using streams.
function copyFile(srcPath, targetPath, cb) {
    var dirname = path.dirname(targetPath);
    var rs = null;
    var ws = null;

    mkpath.sync(dirname);

    rs = fs.createReadStream(srcPath);
    ws = fs.createWriteStream(targetPath);

    function handleErr(err) {
        console.error(err);
        cb(err);
    }

    rs.addListener('error', handleErr);
    ws.addListener('error', handleErr);

    rs.addListener('close', function() {
        cb(null);
    });

    rs.pipe(ws);
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Constructor
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function FileRenamer(inputTree, cfg) {
    if ( !(this instanceof FileRenamer) ) {
        return new FileRenamer(inputTree, cfg);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Configurable properties.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // The path to the digest JSON file.
    this.digestPath = cfg.digestPath;


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Local properties.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    this.inputTree = inputTree;
    this.renameCount = 0;
}

FileRenamer.prototype = Object.create(Writer.prototype);
FileRenamer.prototype.constructor = FileRenamer;

FileRenamer.prototype.write = function(readTree, destDir) {
    var renamer = this;

    return new Promise(function(resolve, reject) {
        readTree(renamer.inputTree).then(function(srcDir) {
            renamer.digestPath = path.join(srcDir, renamer.digestPath);

            msg('Starting to rename files:');

            async.parallel([
                function(cb) {
                    fs.readFile(renamer.digestPath, 'utf8', function(err, data) {
                        cb(err, JSON.parse(data));
                    });
                }
            ], function(err, results) {
                if (err) {
                    reject(err);
                    return;
                }

                var digest = results[0];

                async.each(Object.keys(digest), function(filePath, cb) {
                    var tmpPath = path.join(srcDir, filePath);
                    var tmpTargetPath = path.join(destDir, digest[filePath]);

                    msg('Renaming: ' + digest[filePath]);

                    copyFile(tmpPath, tmpTargetPath, function(err) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            renamer.renameCount += 1;
                            cb(null);
                        }
                    });
                }, function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    msg('Renamed ' + renamer.renameCount + ' files.');
                    resolve(destDir);
                });
            });
        });
    });
};

module.exports = FileRenamer;
