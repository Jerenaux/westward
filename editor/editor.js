/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 22-12-18.
 */

import Phaser from '../node_modules/phaser/dist/phaser.min.js'

import Chunk from '../client/Chunk'
import {SpaceMap} from '../shared/SpaceMap'
import Utils from '../shared/Utils'
import World from '../shared/World'

Chunk.prototype.postDrawTile = function(x,y,tile,sprite){
    this.tilesMap.add(x-this.x,y-this.y,sprite);
    if(COLL == 'client'){
        sprite.collides = !!this.getAtlasData(tile,'collides',true);
        if(sprite.collides) Editor.collisions.add(x,y);
    }else{
        sprite.collides = !!Editor.collisions.get(x,y);
    }
    this.tintSprite(sprite);
    sprite.setInteractive();
    sprite.on('pointerover',function(){
        document.getElementById('debug').innerHTML = tile+' '+this.ground.get(x-this.x,y-this.y);
        document.getElementById('tx').innerHTML = x;
        document.getElementById('ty').innerHTML = y;
        document.getElementById('aoi').innerHTML = this.id;
        sprite.setTint(0xaaaaaa);
    }.bind(this));
    sprite.on('pointerout',function(){
        this.tintSprite(sprite);
    }.bind(this));
    sprite.on('pointerdown',function(){
        Editor.centerCamera(x,y);
    }.bind(this));
};


Chunk.prototype.postDrawImage = function(x,y,image,sprite){
    sprite.setInteractive();
    sprite.on('pointerover',function(){
        document.getElementById('debug').innerHTML = image;
        document.getElementById('tx').innerHTML = x;
        document.getElementById('ty').innerHTML = y;
        sprite.setTint(0xaaaaaa);
    }.bind(this));
    sprite.on('pointerout',function(){
        sprite.setTint(0xffffff);
    }.bind(this));
};

Chunk.prototype.tintSprite = function(sprite){
    //sprite.setTint((sprite.collides ? 0xff0000 : 0xffffff));
    sprite.setTint(0xffffff);
};

Chunk.prototype.getTile = function(x,y){
    var cx = x - this.x;
    var cy = y - this.y;
    return this.tilesMap.get(cx,cy);
};

Chunk.prototype.addOverlay = function(){}

Chunk.prototype.addCollision = function(cx,cy){
    if (COLL == 'client') Editor.collisions.add(cx, cy, 1);
    var tile = this.getTile(cx, cy);
    if(tile) { // Will sometimes be null for tiles of images overlapping AOIs
        tile.collides = true;
        this.tintSprite(tile);
    }
};

Chunk.prototype.removeCollision = function(x,y){}

Chunk.prototype.addResource = function(x,y){}

var BLIT = false;
var COLL = 'client';

var Editor = {
    focusTile: {x:0,y:0},
    mapDataCache: {},
    displayedChunks: [],
    chunks: {},

    zoomScale: 1,
    zoomScales: [2,1,0.75,0.5,0.25,0.1],// 0.05,0.025,0.01
    zoomIndex: 1
};

Editor.preload = function(){
    this.load.json('master','../maps/master.json');
    this.load.json('collisions','../maps/collisions.json');
    this.load.atlas('tileset', '../assets/tilesets/tileset.png', '../assets/tilesets/tileset.json');
};

Editor.create = function(){
    Editor.scene = this.scene.scene;
    World.readMasterData(this.cache.json.get('master'));
    Editor.tilesetData = {};
    Editor.tilesetData.atlas = this.cache.json.get('tileset').frames;
    Editor.tilesetData.config = this.cache.json.get('tileset').config;
    Editor.tilesetData.shorthands = this.cache.json.get('tileset').shorthands;
    Editor.collisions = new SpaceMap();
    if(COLL == 'server') Editor.collisions.fromList(this.cache.json.get('collisions'));
    console.log(Editor.tilesetData);
    Editor.camera = Editor.scene.cameras.main;
    Editor.camera.setBounds(0,0,World.worldWidth*TILE_WIDTH,World.worldHeight*TILE_HEIGHT);

    Editor.updateEnvironment();

    if(BLIT) Editor.ground = Editor.scene.add.blitter(0,0,'tileset');
};

Editor.centerCamera = function(x,y){
    //console.log(x,y,id);
    Editor.camera.centerOn(x*TILE_WIDTH,y*TILE_HEIGHT);
    Editor.focusTile = {x:x,y:y};
    Editor.updateEnvironment();
};

Editor.getMouseCoordinates = function(pointer){
    var pxX = Editor.camera.x + pointer.x;
    var pxY = Editor.camera.y + pointer.y;
    var tileX = Math.floor(pxX/(TILE_WIDTH*Editor.zoomScale));
    var tileY = Math.floor(pxY/(TILE_HEIGHT*Editor.zoomScale));
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Editor.updateEnvironment = function(){
    var vizW = Math.ceil(VIEW_WIDTH/Editor.zoomScale);
    var vizH = Math.ceil(VIEW_HEIGHT/Editor.zoomScale);
    var vizL = Math.min(Math.floor(vizW/2),Editor.focusTile.x);
    var vizR = Math.min(vizW-vizL,World.worldWidth);
    var vizT = Math.min(Math.floor(vizH/2),Editor.focusTile.y);
    var vizB = Math.min(vizH-vizT,World.worldHeight);

    var chunks = new Set();
    for(var x = -vizL; x < vizR; x++){
        for(var y = -vizT; y < vizB; y++){
            var tile = {x:0,y:0};
            tile.x = Editor.focusTile.x + x;
            tile.y += Editor.focusTile.y + y;
            chunks.add(Utils.tileToAOI(tile));
        }
    }
    chunks = Array.from(chunks);
    //var chunks = Utils.listAdjacentAOIs(Editor.focusChunk);
    var newChunks = chunks.diff(Editor.displayedChunks);
    var oldChunks = Editor.displayedChunks.diff(chunks);
    console.log('Displaying',newChunks.length,'/',chunks.length,'chunks');

    for (var i = 0; i < oldChunks.length; i++) {
        Editor.removeChunk(oldChunks[i]);
    }

    for(var j = 0; j < newChunks.length; j++){
        Editor.displayChunk(newChunks[j]);
    }
};

Editor.displayChunk = function(id){
    if(Editor.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Editor.addChunk(Editor.mapDataCache[id],id);
    }else {
        Editor.loadJSON('../maps/chunk' + id + '.json', Editor.addChunk, id);
    }
};

Editor.loadJSON = function(path,callback,data){
    // TODO: use built-in Phaser custom loader
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),data);
        }
    };
    xobj.send(null);
};

Editor.addChunk = function(mapData){
    var chunk = new Chunk(mapData, Editor.tilesetData, Editor.scene);
    Editor.chunks[chunk.id] = chunk;
    if (!Editor.mapDataCache[chunk.id]) Editor.mapDataCache[chunk.id] = mapData;
    Editor.displayedChunks.push(chunk.id);
};

Editor.drawChunks = function(){
    for(var id in Editor.chunks){
        var chunk = Editor.chunks[id];
        if(!chunk.displayed) chunk.draw();
    }
};

Editor.removeChunk = function(id){
    if(!(id in Editor.chunks)) return;
    Editor.chunks[id].erase();
    Editor.displayedChunks.splice(Editor.displayedChunks.indexOf(id),1);
    delete Editor.chunks[id];
};

Editor.zoom = function(coef){
    Editor.zoomIndex = Utils.clamp(Editor.zoomIndex - coef,0,Editor.zoomScales.length-1);
    Editor.zoomScale = Editor.zoomScales[Editor.zoomIndex];
    Editor.camera.setZoom(Editor.zoomScale);

    Editor.updateEnvironment();
};

var Engine = Editor;

function f(x,y){
    Editor.centerCamera(x,y);
}

function add(x,y,image){
    var id = Utils.tileToAOI({x:x,y:y});
    console.log(id);
    var chunk = Editor.chunks[id];
    //x -= chunk.x;
    //y -= chunk.y;
    chunk.drawImage(x,y,image);
}

function snap (){
    game.renderer.snapshot(function(img){
        document.getElementById("render").src = img.src;
    });
}

var VIEW_WIDTH = 30;
var VIEW_HEIGHT = 20;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var config = {
    type: Phaser.WEBGL,
    width: VIEW_WIDTH*TILE_WIDTH,
    height: VIEW_HEIGHT*TILE_HEIGHT,
    parent: 'game',
    scene: [Editor]
};

var game = new Phaser.Game(config);