/**
 * Created by Jerome on 14-07-17.
 */
var fs = require('fs');
var clone = require('clone');

function splitMap(fileName,outputDirectory,AOIwidth,AOIheight){
    if(!fileName){
        console.log('ERROR : No file name specified!');
        console.log('-i = file name relative to assets/maps, with or without out json extension');
        console.log('-o = (optional) name of directory where chunks have to be generated (default assets/maps/chunks)');
        console.log('-w = width of the chunks, in tiles (default 34)');
        console.log('-h = height of the chunks, in tiles (default 20)');
        return;
    }
    if(fileName.substr(-5) == ".json") fileName = fileName.slice(0,-5);

    if(!outputDirectory) outputDirectory = 'chunks';
    var path = '/../assets/maps/';
    if (!fs.existsSync(__dirname+path+outputDirectory)) fs.mkdirSync(__dirname+path+outputDirectory);

    if(!AOIwidth) AOIwidth = 34;
    if(!AOIheight) AOIheight = 20;
    console.log('splitting');

    fs.readFile(__dirname+path+fileName+".json", 'utf8', function (err, data) {
        if (err) throw err;
        var map = JSON.parse(data);
        var mapWidth = map.width;
        var mapHeight = map.height;
        var nbAOIhoriz = Math.ceil(mapWidth/AOIwidth);
        var nbAOIvert = Math.ceil(mapHeight/AOIheight);
        var nbAOI = nbAOIhoriz*nbAOIvert;
        var lastID = nbAOI-1;
        console.log('Splitting into '+nbAOI+' AOIs ('+nbAOIhoriz+' x '+nbAOIvert+') of size ('+AOIwidth+' x '+AOIheight+')');

        var master = {
            tilesets: map.tilesets,
            AOIwidth: AOIwidth,
            AOIheight: AOIheight,
            nbAOIhoriz: nbAOIhoriz,
            nbAOIvert: nbAOIvert
        };
        fs.writeFile(__dirname+path+outputDirectory+'/master.json',JSON.stringify(master),function(err){
            if(err) throw err;
        });

        for(var aoi = 0; aoi <= lastID; aoi++){
            var subMap = clone(map);
            //delete subMap.tilesets;
            var x = (aoi%nbAOIhoriz)*AOIwidth;
            var y = Math.floor(aoi/nbAOIhoriz)*AOIheight;
            subMap.width = AOIwidth;
            subMap.height = AOIheight;
            subMap.width = Math.min(AOIwidth,mapWidth-x);
            subMap.height = Math.min(AOIheight,mapHeight-y);
            subMap.aoi = aoi;
            var liststart = mapWidth*y + x; // At which index in the list corresponds the top left tile of the submap

            for(var i= 0; i < subMap.layers.length; i++) { // Scan all layers one by one
                var layer = subMap.layers[i];
                layer.width = subMap.width;
                layer.height = subMap.height;
                if (layer.type === "tilelayer") {
                    var tmpdata = [];
                    for(var yi = 0; yi < layer.height; yi++){
                        var begin = liststart + yi*mapWidth;
                        var end = begin+layer.width;
                        var line = layer.data.slice(begin,end);
                        tmpdata = tmpdata.concat(line);
                    }
                    layer.data = tmpdata;
                }
            }

            // TODO here: remove tiles based on top-down visibility

            // Remove empty layers
            for(var j = subMap.layers.length - 1; j >= 0; j--){
                var layer = subMap.layers[j];
                if(layer.type === "objectgroup") continue;
                if(layer.data.reduce(function(a,b){return a+b;},0) == 0){ // if layer entirely composed of '0' tiles
                    subMap.layers.splice(j,1);
                }
            }

            // Update tileset paths
            for(var k = 0; k < subMap.tilesets.length; k++){
                var tileset = subMap.tilesets[k];
                tileset.image = "..\/"+tileset.image;
            }

            fs.writeFile(__dirname+path+outputDirectory+'/chunk'+aoi+'.json',JSON.stringify(subMap),function(err){
                if(err) throw err;
            });
        }
        console.log('Writing to '+__dirname+path+outputDirectory);
    });
}

var myArgs = require('optimist').argv;
splitMap(myArgs.i,myArgs.o,myArgs.w,myArgs.h);