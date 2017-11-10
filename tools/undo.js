/**
 * Created by Jerome on 10-11-17.
 */

var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;
var fs = require('fs');
var path = require('path');

function undo(directory) {
    var indir = path.join(__dirname,WorldEditor.mapsPath,directory);

    fs.readdir(indir, function (err, files) {
        if (err) throw err;
        for(var i = 0; i < files.length; i++) {
            var bkpFile = files[i];
            if (bkpFile[0] == '_') {
                var file = bkpFile.substr(1);
                var bkpPath = path.join(indir,bkpFile);
                var filePath = path.join(indir,file);
                fs.unlinkSync(filePath);
                fs.rename(bkpPath,filePath,function(err){
                    if(err) throw err;
                });
            }
        }
    });
}

var myArgs = require('optimist').argv;
undo(myArgs.i);