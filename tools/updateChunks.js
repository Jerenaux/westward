/**
 * Created by jeren on 11-12-17.
 */

/**
 * Created by Jerome on 27-11-17.
 */

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

//var path = '/../assets/maps/';
var fs = require('fs');
var path = require('path');
var args = require('optimist').argv;

var indir = path.join(__dirname,WorldEditor.mapsPath,args.i);
var masterData = JSON.parse(fs.readFileSync(path.join(indir,'master.json')).toString());
World.readMasterData(masterData);

var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
console.log(nbChunks+' chunks to process');

var counter = 0;
for(var i = 0; i < nbChunks; i++){
    var filename = 'chunk'+i+'.json';
    var p = path.join(indir,filename);
    if(!fs.existsSync(p)) return;
    var map = JSON.parse(fs.readFileSync(p).toString());

    for(var j = 0; j < map.tilesets.length; j++){
        var fileName = path.basename(map.tilesets[j].image);
        map.tilesets[j].image = path.join(WorldEditor.tilesetsPath,fileName);
    }

    fs.writeFile(p,JSON.stringify(map),function(err){
        if(err) throw err;
        counter++;
        if(counter >= nbChunks) console.log('All chunks updated');
    });
}