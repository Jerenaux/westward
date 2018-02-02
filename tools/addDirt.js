/**
 * Created by Jerome on 01-02-18.
 */


var World = require('../shared/World.js').World;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;
var Geometry = require('../studio/Geometry.js').Geometry;
var Utils = require('../shared/Utils.js').Utils;
var fs = require('fs');
var path = require('path');
var myArgs = require('optimist').argv;

var indir = path.join(__dirname,WorldEditor.mapsPath,myArgs.i);
var masterData = JSON.parse(fs.readFileSync(path.join(indir,'master.json')).toString());
World.readMasterData(masterData);

var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
for(var i = 0; i < nbChunks; i++) {
    var fileName = 'chunk'+i+'.json';
    var p = path.join(indir,fileName);
    if(fs.existsSync(p)) WorldEditor.readChunk(i,JSON.parse(fs.readFileSync(p).toString()),true);
}

console.log(WorldEditor.isWater(572,858));
console.log(WorldEditor.isWater(577,864));
console.log(WorldEditor.isWater(558,872));

var nb_patches = myArgs.n || 100;
var ok = 0;

for(var i = 0; i < nb_patches; i++){
    var x = Utils.randomInt(0,World.worldWidth+1);
    var y = Utils.randomInt(0,World.worldHeight+1);
    var w = Utils.randomInt(2,7);
    var h = Utils.randomInt(2,7);
    var border = Geometry.makeCorona(x,y,w,h);
    for(var j = 0; j < border.length; j++){
        var pt = border[j];
        if(WorldEditor.isWater(pt.x,pt.y)) break;
    }
    if(j < border.length-1) continue;
    // TODO: draw dirt outline
    // TODO: fill it
    ok++;
}
console.log(ok+' patches');
