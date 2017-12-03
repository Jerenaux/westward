/**
 * Created by Jerome on 14-07-17.
 */

var fs = require('fs');
var path = require('path');
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

var indir, outdir, total;
var counter = 0;

var allData = {};

function Layer(){
    this.data = [];
}

function flatten(directory){
    if(!directory){
        console.log('ERROR : No directory specified! Arguments :');
        console.log('-i = directory relative to assets/maps containing the chunks to flatten');
        return;
    }

    indir = path.join(__dirname,WorldEditor.mapsPath,directory);
    outdir = path.join(__dirname,WorldEditor.mapsPath,directory+'_flat');
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    fs.readdir(indir,function(err,files){
        total = files.length;
        console.log(total+' files to flatten');
        for(var i = 0; i < files.length; i++){
            var f = files[i];
            //if(f == 'master.json') {
            if(f.substr(0,5) != 'chunk'){
                fs.createReadStream(path.join(indir, f)).pipe(fs.createWriteStream(path.join(outdir, f)));
            }else {
                flattenChunk(f);
            }
        }
    });
}

function flattenChunk(fileName){
    console.log('flattening '+fileName);

    fs.readFile(path.join(indir,fileName), 'utf8', function (err, data) {
        if (err) throw err;
        var map = JSON.parse(data);
        var newmap = {
            height: map.height,
            width: map.width,
            tileheight: map.tileheight,
            tilewidth: map.tilewidth,
            layers: []
        };
        var tilelayers = [];

        var layer0 = new Layer();
        fillLayer(layer0,map.width*map.height);
        tilelayers.push(layer0);

        for (var i = 0; i <= WorldEditor.lowLayers; i++) { // Scan ground layers one by one
            var layer = map.layers[i];
            if (layer.type === "tilelayer") {
                //console.log('processing ' + layer.name);
                for (var j = 0; j < layer.data.length; j++) { // Scan all tiles one by one
                    addTile(tilelayers,j,layer.data[j],map.width,map.height);
                }
                //console.log('done with layer ' + layer.name);
            }
        }
        newmap.layers = tilelayers;
        // Add high layers
        for(var i = WorldEditor.lowLayers+1; i <= Math.min(WorldEditor.maxLayer,map.layers.length-1); i++){
            newmap.layers.push(map.layers[i]);
        }
         // TODO here: remove tiles based on top-down visibility

         // Remove empty layers
         for(var j = newmap.layers.length - 1; j >= 0; j--){
             var layer = newmap.layers[j];
             if(layer.data.reduce(function(a,b){return a+b;},0) == 0){ // if layer entirely composed of '0' tiles
                newmap.layers.splice(j,1);
             }
         }

        //console.log("Initial #layers = "+map.layers.length);
        //console.log("New #layers = "+newmap.layers.length);

        fs.writeFile(path.join(outdir,fileName),JSON.stringify(newmap),function(err){
            counter++;
            if(counter == total-2) {
                console.log('All files flattened');
                //writeAllData();
            }
        });
    });
}

function writeAllData(){
    fs.writeFile(path.join(outdir,'allData.json'),JSON.stringify(allData),function(err){
        console.log('All-data written');
    });
}

function addTile(layerArray,index,tile,w,h){
    if(tile == 0) return;
    var depth = 0;
    // Look for the first layer wih an empty tile at the corresponding position (=index)
    while (layerArray[depth].data[index] != 0 && layerArray[depth].data[index] !== undefined) {
        depth++; // If non-empty, increase depth = look one layer further
        if (depth >= layerArray.length) { // If reached max depth, create new layer
            layerArray.push(new Layer());
            fillLayer(layerArray[depth], w*h);
        }
    }
    layerArray[depth].data[index] = tile;
}

function fillLayer(layer,n){
    for(var k = 0; k < n; k++){
        layer.data.push(0);
    }
}

var myArgs = require('optimist').argv;
flatten(myArgs.i);