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

    var fillNodes = [
        /*{x: 99,y: 1083},
        {x: 78,y: 1068},
        {x: 46,y: 1054},
        {x: 39,y: 1045}*/
        /*{x: 526,y: 708},
        {x: 517,y: 677},
        {x: 538,y: 718},
        {x: 551,y: 716},
        {x: 527,y: 644}*/
        /*{x: 490,y: 688},
        {x: 515,y: 694},
        {x: 526,y: 683}*/
        /*{x: 601,y: 754},
        {x: 609,y: 774},*/
        //{x: 590,y: 807}
        {x: 508,y: 804},
        {x: 518,y: 815}
    ];
    // 193, 28 ; 135, 109

    for(var i = 0; i < fillNodes.length; i++){
        WorldEditor.fill(fillNodes[i],10000);
    }

    var arr = Array.from(WorldEditor.dirtyChunks);
    var counter = 0;
    for(var i = 0; i < arr.length; i++){
        var fileName = 'chunk'+arr[i]+'.json';
        var bkp = '_'+fileName;
        var filePath = path.join(indir,fileName);
        var bkpPath = path.join(indir,bkp);
        fs.renameSync(filePath,bkpPath);
        fs.writeFile(filePath,JSON.stringify(WorldEditor.chunks[arr[i]]),function(err) {
            if(err) throw err;
            counter++;
            if(counter == arr.length) console.log('All files written');
        });
    }
}

var myArgs = require('optimist').argv;
fillMap(myArgs.i);