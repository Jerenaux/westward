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

//var terrain = Object.values(WorldEditor.shore).concat(Object.values(WorldEditor.grass));
//console.log(terrain);

for(var i = 0; i < nbChunks; i++){
    var filename = 'chunk'+i+'.json';
    var p = path.join(indir,filename);
    if(!fs.existsSync(p)) return;
    var map = JSON.parse(fs.readFileSync(p).toString());

    var dirty = false;
    for(var l = 0; l < map.layers.length; l++){
        for(var d = 0; d < map.layers[l].data.length; d++){
            var t = map.layers[l].data[d];
            // OR: remove ID's in range [trees.firstgid, trees.firstgid+nbtiles]
            //if(t > 0 && !terrain.includes(t)) {
            if(t > 682 && t < 808){
                map.layers[l].data[d] = 0;
                dirty = true;
            }
        }
    }

    if(dirty){
        fs.writeFile(p,JSON.stringify(map),function(err){
            if(err) throw err;
        });
    }
}