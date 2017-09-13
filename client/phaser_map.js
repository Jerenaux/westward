/**
 * Created by Jerome on 12-09-17.
 */

var config = {
    type: Phaser.WEBGL,
    width: 32*32,
    height: 18*32,
    parent: 'game',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var Game;

var Engine = {
    nbChunksHorizontal: 6,
    lastChunkID: 96
};

function preload(){
    //this.load.json('chunk0','assets/maps/pqchunks_flat/chunk0.json');
    //this.load.json('chunk1','assets/maps/pqchunks_flat/chunk1.json');
    this.load.image('tileset','assets/tilesets/tilesheet.png');
    this.load.image('hero','assets/sprites/hero.png');
}

function addMap(data,x,y){
    for(var i = 0; i < game.nbLayers; i++){
        var mapConfig = {
            map: {
                /*data: data[i].data.map(function(x){
                    return x-1;
                 }),*/
                data: [],
                width: 34,
                height: 20
            },
            tile: {
                width: 32,
                height: 32,
                texture: 'tileset'
            }
        };
        game.layers[i] = Game.make.tilemap(mapConfig);
    }
}

function create(){
    Game = game.scene.scenes[0];
    game.sx = 0;
    game.sy = 0;
    game.layers = [];
    game.nbLayers = 5;
    game.chunksCache = {};
    //var layerData = this.cache.json.get('chunk0').layers;
    addMap([],0,0);
    //addMap(this.cache.json.get('chunk1').layers,(3)*32,0);
    game.cameraAOI = {
        current: 0,
        right: 0,
        bottom: 0
    };
    game.oldaoi = 0;
    game.displayedAOI = [];


    game.hero = Game.add.sprite(500,128,'hero');
    game.hero.tile = new Phaser.Geom.Point(35,0);
    game.xdist = -1;
    game.ydist = -1;

    game.fixed = Game.add.sprite(12,12,'hero');
    initChunks();
}

function loadChunk(id,callback,info){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'assets/maps/pqchunks_flat/chunk'+id+'.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),id);
        }
    };
    xobj.send(null);
}

function displayChunk(data,chunkID){
    for (var x = 0; x < 34; x++) {
        for (var y = 0; y < 20; y++) {
            for (var l = 0; l < game.layers.length; l++) {
                var v = (y*34)+x;
                var id = data.layers[l].data[v];
                var tile = game.layers[l].getTileAt(x, y);
                tile.setId(id > 0 ? id-1 : 473);
            }
        }
    }
    storeChunk(data,chunkID);
}

function storeChunk(data,id){
    game.chunksCache[id] = data;
}

function getAOI(x,y){
    var top = Math.floor(y/20);
    var left = Math.floor(x/34);
    if(left < 0) left = 0;
    if(top < 0) top = 0;
    var aoi = (top*6)+left;
    return aoi;
}

function initChunks(){
    var aoi = getAOI(game.hero.tile.x,game.hero.tile.y);
    var adjacent = Utils.listAdjacentAOIs(aoi);
    loadChunk(aoi,displayChunk);
    adjacent.forEach(function(id){
        if(id == aoi) return;
        loadChunk(id,storeChunk,id);
    });
}

function loadAdjacent(aoi){
    var adjacent = Utils.listAdjacentAOIs(aoi);
    adjacent.forEach(function(id){
        if(id == aoi) return;
        if(game.chunksCache.hasOwnProperty(id)) return;
        console.log('loading '+id);
        loadChunk(id,storeChunk);
    });
}


function update(){
    // TODO keep track of sprites appearing and disappearing
    var xinc = 2;
    var yinc = 0;
    if(game.xdist >= 100) xinc = 0;
    if(game.ydist >= 300) yinc = 0;
    game.sx += xinc;
    game.sy += yinc;
    game.fixed.x += xinc;
    game.fixed.y += yinc;
    if(game.sx == 32) shift('x',xinc);
    if(game.sy == 32) shift('y',yinc);
    this.cameras.main.scrollX = game.sx;
    this.cameras.main.scrollY = game.sy;
}

function shift(c,inc){
    game.hero[c] -= 32;
    game[c+'dist']++;
    //var aoi = getAOI(game.xdist,game.ydist);
    var aoi = getAOI(game.hero.tile.x+game.xdist,game.hero.tile.y+game.ydist);
    // optimize
    loadAdjacent(aoi);
    loadAdjacent(aoi+1);
    loadAdjacent(aoi+1+6);
    loadAdjacent(aoi+6);
    /*loadAdjacent(getAOI(game.xdist+34,game.ydist));
    loadAdjacent(getAOI(game.xdist+34,game.ydist+20));
    loadAdjacent(getAOI(game.xdist,game.ydist+20));*/
    /*loadAdjacent(getAOI(game.hero.tile.x+34,game.hero.tile.y));
     loadAdjacent(getAOI(game.hero.tile.x+34,game.hero.tile.y+20));
     loadAdjacent(getAOI(game.hero.tile.x,game.hero.tile.y+20));*/
    var sign = Math.abs(inc)/inc;

    for (var x = 0; x < 34; x++)
    {
        for (var y = 0; y < 20; y++)
        {
            for(var l = 0; l < game.layers.length; l++) {
                var tile = game.layers[l].getTileAt(x, y);
                if((c == 'x' && x == 33) || (c == 'y' && y == 19)) {
                    var v;
                    if (c == 'x') {
                        v = (y * 34) + (game.xdist % 34);
                    } else if (c == 'y') {
                        v = ((game.ydist % 20) * 34) + x;
                    }
                    var dataAOI = (c == 'x' ? aoi+sign : aoi+(6*sign));
                    var id = game.chunksCache[dataAOI].layers[l].data[v];
                    tile.setId(id > 0 ? id-1 : 473);
                }else{
                    var newx = (c == 'x' ? x+sign : x);
                    var newy = (c == 'y' ? y+sign : y);
                    var next = game.layers[l].getTileAt(newx%34, newy%20);
                    if(next.id > 0) tile.setId(next.id);
                }
            }
        }
    }
    game['s'+c] = 0;
    game.fixed[c] -= 32;
}


function step(){
    game.sx += 32;
    if(game.sx == 32){
        game.dist++;
        for (var x = 0; x < 34; x++)
        {
            for (var y = 0; y < 20; y++)
            {
                for(var l = 0; l < game.layers.length; l++) {
                    var tile = game.layers[l].getTileAt(x, y);
                    if(x == 33){
                        var v = (y*34)+(game.dist%34);
                        var id = game.nextData[l].data[v];
                        //if(id > 0) tile.setId(id-1);
                        tile.setId(id > 0 ? id-1 : 473);
                    }else{
                        var next = game.layers[l].getTileAt((x+1)%34, y);
                        if(next.id > 0) tile.setId(next.id);
                    }
                }
            }
        }
        game.sx = 0;
    }

}