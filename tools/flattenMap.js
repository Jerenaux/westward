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

function flatten(fileName,outputFilename){
    if(!fileName){
        console.log('ERROR : No file name specified! Arguments :');
        console.log('-i = file name relative to assets/maps, with or without out json extension');
        console.log('-o = (optional) file name relative toa ssets/maps, WITHOUT json extension');
        return;
    }
    if(fileName.substr(-5) == ".json") fileName = fileName.slice(0,-5);
    if(!outputFilename){
        outputFilename = 'mini'+fileName;
    }
    console.log('flattening');
    var path = '/../assets/maps/';

    fs.readFile(__dirname+path+fileName+".json", 'utf8', function (err, data) {
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


        newmap.layers = tilelayers.concat(objectlayers);

        console.log("Initial #layers = "+map.layers.length);
        console.log("New #layers = "+newmap.layers.length);

        fs.writeFile(__dirname+path+outputFilename+'.json',JSON.stringify(newmap),function(err){
            console.log('Newmap written to '+path+outputFilename+'.json');
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
flatten(myArgs.i,myArgs.o);