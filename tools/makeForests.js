/**
 * Created by Jerome on 17-11-17.
 */

var World = require('../shared/World.js').World;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;
var Utils = require('../shared/Utils.js').Utils;
var Jimp = require("jimp");
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
    var counter = 0;
    var greenPixels = [];
    image.scan(0, 0, image.bitmap.width, 230, function (x, y, idx) { // image.bitmap.width
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image

        var red   = this.bitmap.data[ idx + 0 ];
        var green = this.bitmap.data[ idx + 1 ];
        var blue  = this.bitmap.data[ idx + 2 ];

        if(red == 203 && green == 230 && blue == 163){
            counter++;
            var gx = Math.round(x*(50*30/image.bitmap.width));
            var gy = Math.round(y*(57*20/image.bitmap.height));
            gx += randomInt(-3,4);
            gy += randomInt(-3,4);
            WorldEditor.drawTree(gx,gy);
        }

    });


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