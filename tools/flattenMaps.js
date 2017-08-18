/**
 * Created by Jerome on 14-07-17.
 */

var fs = require('fs');
var clone = require('clone');

function Layer(w,h,name) {
    this.width = w;
    this.height = h;
    this.name = name;
    this.type = "tilelayer";
    this.data = []; // Array of tiles
    /*this.visible = true;
     this.x = 0;
     this.y = 0;
     this.opacity = 1;*/
}

var path = '/../assets/maps/';

function flatten(directory){
    if(!directory){
        console.log('ERROR : No directory specified! Arguments :');
        console.log('-i = directory relative to assets/maps containing the chunks to flatten');
        return;
    }

    var outdir = __dirname+path+directory+'_flat';
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    var indir = __dirname+path+directory;
    fs.readdir(indir,function(err,files){
        for(var i = 0; i < files.length; i++){
            var f = files[i];
            if(f == 'master.json'){
                fs.createReadStream(indir+'/'+f).pipe(fs.createWriteStream(outdir+'/'+f));
            }else {
                flattenChunk(indir, f, outdir);
            }
        }
    });
}

function flattenChunk(indir,fileName,outdir){
    console.log('flattening '+fileName);

    fs.readFile(indir+'/'+fileName, 'utf8', function (err, data) {
        if (err) throw err;
        var map = JSON.parse(data);
        var newmap = clone(map);
        newmap.layers = [];
        var tilelayers = [];
        var objectlayers = [];

        var layer0 = new Layer(map.width,map.height,"layer0");
        fillLayer(layer0,map.width*map.height);
        tilelayers.push(layer0);

        for (var i = 0; i < map.layers.length; i++) { // Scan all layers one by one
            var layer = map.layers[i];
            if (layer.type === "tilelayer") {
                //console.log('processing ' + layer.name);
                for (var j = 0; j < layer.data.length; j++) { // Scan all tiles one by one
                    /*var tileProperties = map.tilesets[0].tileproperties[layer.data[j] - 1];
                     if (tileProperties && tileProperties.hasOwnProperty('v')) {
                     addTile(highLayers, true, j, layer.data[j], map.width, map.height);
                     } else {
                     addTile(newLayers, false, j, layer.data[j], map.width, map.height);
                     }*/
                    addTile(tilelayers,false,j,layer.data[j],map.width,map.height);
                }
                //console.log('done with layer ' + layer.name);
            } else if (layer.type === "objectgroup") {
                //objectlayers.push(layer);
            }
        }

        /*
         // TODO here: remove tiles based on top-down visibility

         // Remove empty layers
         for(var j = subMap.layers.length - 1; j >= 0; j--){
         var layer = subMap.layers[j];
         if(layer.type === "objectgroup") continue;
         if(layer.data.reduce(function(a,b){return a+b;},0) == 0){ // if layer entirely composed of '0' tiles
         subMap.layers.splice(j,1);
         }
         }*/

        newmap.layers = tilelayers.concat(objectlayers);

        console.log("Initial #layers = "+map.layers.length);
        console.log("New #layers = "+newmap.layers.length);

        fs.writeFile(outdir+'/'+fileName,JSON.stringify(newmap),function(err){
            console.log('done');
        });
    });
}

function addTile(layerArray,high,index,tile,w,h){
    if(tile == 0) return;
    var depth = 0;
    // Look for the first layer wih an empty tile at the corresponding position (=index)
    while (layerArray[depth].data[index] != 0 && layerArray[depth].data[index] !== undefined) {
        depth++; // If non-empty, increase depth = look one layer further
        if (depth >= layerArray.length) { // If reached max depth, create new layer
            var name = (high ? "highlayer" : "layer") + depth;
            layerArray.push(new Layer(w,h, name));//,(high ? "high" : "ground")));
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