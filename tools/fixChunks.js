/**
 * Created by Jerome on 26-11-17.
 */

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

//var path = '/../assets/maps/';
var fs = require('fs');
var path = require('path');

var args = require('optimist').argv;
var directory = args.i;
var indir = path.join(__dirname,WorldEditor.mapsPath,directory);

var masterData = JSON.parse(fs.readFileSync(path.join(indir,'/master.json')).toString());
World.readMasterData(masterData);

var total = World.nbChunksVertical;
var counter = 0;
var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
for(var i = 0; i < nbChunks; i+=World.nbChunksHorizontal){
    var fileName = 'chunk'+i+'.json';
    console.log('processing '+fileName);
    var bkp = '_'+fileName;
    var filePath = path.join(indir,fileName);
    var bkpPath = path.join(indir,bkp);
    var map = JSON.parse(fs.readFileSync(filePath).toString());

    for(var l = 0; l < map.layers.length; l++){
        var goodData = [];
        for(var d = 0; d < map.layers[l].data.length; d++){
            var datum = map.layers[l].data[d];
            if(datum !== null) goodData.push(datum);
        }
        //console.log(goodData.length);
        map.layers[l].data = goodData;
    }

    fs.renameSync(filePath,bkpPath);
    fs.writeFile(filePath,JSON.stringify(map),function(err) {
        if(err) throw err;
        counter++;
        if(counter == total) console.log('All files written');
    });
}