/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-12-18.
 */
var path = require('path');
var fs = require('fs');
var config = require('config');
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var World = require('../shared/World.js').World;

var filename = 'chunk390.json';
var mapsPath = config.get('dev.mapsPath');
var indir = 'eastcoast';
var fpath = path.join(__dirname,mapsPath,indir,filename);
console.log(fpath);
var p = path.join(fpath);
if(!fs.existsSync(p)) return;
var map = JSON.parse(fs.readFileSync(p).toString());


function Chunk(id){
    this.id = id;
    var origin = Utils.AOItoTile(this.id);
    this.x = origin.x;
    this.y = origin.y;
    this.defaultTile = 'grass';
    this.layers = [new SpaceMap()];
}

Chunk.prototype.trim = function(){
    var layers = [];
    this.layers.forEach(function(layer){
        layers.push(layer.toList());
    });
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        default: this.defaultTile,
        layers: layers
    };
};

var counter = 0;
var total = 1;
Chunk.prototype.write = function(chunkpath){
    var name = 'chunk'+this.id+'.json';
    fs.writeFile(path.join(chunkpath,name),JSON.stringify(this.trim()),function(err){
        if(err) throw err;
        counter++;
        if(counter == total) console.log(counter+' files written');
    });
};

World.setUp(1,1,30,20,32,32);
var chunk = new Chunk(0);
//var grass = [258,259,274,275];

var cnt = 0;
for(var i = 0; i < map.layers[0].data.length; i++){
    var tile = map.layers[0].data[i];
    var tx = Utils.lineToGrid(i,30);
    //if(grass.includes(tile)){
    if(tile >= 322){
        //console.warn('GRASS');
        //chunk.layers[0].add(tx.x,tx.y,'grass');
    }else{
        //console.log(tx.x,tx.y,tile);
        var tn = (tile == 297 ? 'w' : 'c');
        chunk.layers[0].add(tx.x,tx.y,tn);
        cnt++;
    }
}
console.warn(cnt);


var outdir = 'testmap';
chunk.write(path.join(__dirname,mapsPath,outdir));