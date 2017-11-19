/**
 * Created by Jerome on 17-11-17.
 */

var World = require('../shared/World.js').World;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;
var Utils = require('../shared/Utils.js').Utils;
var Jimp = require("jimp");
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

Jimp.read(path.join(__dirname,myArgs.s), function (err, image) {
    if (err) throw err;
    //var done = false;
    console.log('Scanning image '+myArgs.s);
    var greenpixels = [];
    image.scan(0, 0, image.bitmap.width, image.bitmap.width, function (x, y, idx) {
        //if(done) return;
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image

        var red   = this.bitmap.data[ idx + 0 ];
        var green = this.bitmap.data[ idx + 1 ];
        var blue  = this.bitmap.data[ idx + 2 ];

        if(red == 203 && green == 230 && blue == 163) greenpixels.push({x:x,y:y});
    });

    greenpixels.sort(function(a,b){
        if(a.y < b.y) return -1;
        if(a.y == b.y) return 0;
        if(a.y > b.y) return 1;
    });

    var xRandRange = 7;
    var yRandRange = 7;
    var nbtrees = 0;
    for(var i = 0; i < greenpixels.length; i++){
        var px = greenpixels[i];
        var x = px.x;
        var y = px.y;
        var gx = Math.round(x*(50*30/image.bitmap.width));
        var gy = Math.round(y*(57*20/image.bitmap.height));
        gx += Utils.randomInt(-xRandRange,xRandRange+1);
        gy += Utils.randomInt(-yRandRange,yRandRange+1);
        if(WorldEditor.drawTree(gx,gy)) nbtrees++;
    }
    console.log(nbtrees+' drawn');

    /*fs.writeFile(path.join(__dirname,'blueprints','trees.json'),JSON.stringify(greenPixels),function(err){
        if(err) throw err;
        console.log('Green pixels written');
    });*/

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
});