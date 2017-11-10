/**
 * Created by Jerome on 10-11-17.
 */

/*
Write dirty chunks
* */

var World = require('../shared/World.js').World;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;
var path = require('path');
var fs = require('fs');

var chunks = {};

function fillMap(directory){
    var indir = path.join(__dirname,WorldEditor.mapsPath,directory);
    var masterData = JSON.parse(fs.readFileSync(path.join(indir,'master.json')).toString());
    World.readMasterData(masterData);

    var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
    for(var i = 0; i < nbChunks; i++) {
        var fileName = 'chunk'+i+'.json';
        var p = path.join(indir,fileName);
        if(fs.existsSync(p)) WorldEditor.readChunk(i,JSON.parse(fs.readFileSync(p).toString()),true);
    }

    var fillNodes = [{
        x: 233,
        y: 1070
    }];

    WorldEditor.fill(fillNodes[0],100);
    console.log(WorldEditor.dirtyChunks);

    var arr = Array.from(WorldEditor.dirtyChunks);
    var counter = 0;
    for(var i = 0; i < arr.length; i++){
        var fileName = 'chunk'+arr[i]+'.json';
        fs.writeFile(path.join(indir,fileName),JSON.stringify(WorldEditor.chunks[arr[i]]),function(err) {
            if(err) throw err;
            counter++;
            if(counter == arr.length) console.log('All files written');
        });
    }
}

var myArgs = require('optimist').argv;
fillMap(myArgs.i);