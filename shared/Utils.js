/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    World = require('./World.js').World;
}

var Utils = {};

Utils.getPreference = function(parameter,defaultValue){ // Retrieve sorting preferences for localStorage or return a default value
    var pref = localStorage.getItem(parameter);
    if(pref === null) return defaultValue;
    // The following is needed because localStorage stores as text
    if(pref == 'true') return true;
    if(pref == 'false') return false;
    return parseInt(pref);
};

Utils.tileToAOI = function(tile){ // input coords in Tiles
    if(!World.nbChunksHorizontal){
        console.log('ERROR : Chunk data not initialized');
        return 0;
    }
    //if(tile.x < 0 || tile.y < 0) console.log('ALERT: negative coordinates');
    var top = Math.floor(tile.y/World.chunkHeight);
    var left = Math.floor(tile.x/World.chunkWidth);
    return (top*World.nbChunksHorizontal)+left;
};

Utils.AOItoTile = function(aoi){
    if(!World.nbChunksHorizontal) console.log('ERROR : Chunk data not initialized');
    return {
        x : (aoi%World.nbChunksHorizontal)*World.chunkWidth,
        y : Math.floor(aoi/World.nbChunksHorizontal)*World.chunkHeight
    };
};

Utils.gridToLine = function(x,y,w){
    return (y*w)+x;
};

Utils.lineToGrid = function(i,w){
    return {
        x: i%w,
        y: Math.floor(i/w)
    }
};

// Returns the x and y offets of a chunk, in chunks, from the top left
Utils.getMacroCoordinates = function(chunk){
    return {
        x: chunk%World.nbChunksHorizontal,
        y: Math.floor(chunk/World.nbChunksHorizontal)
    }
};

Utils.listVisibleAOIs = function(start){ // List the visible chunks around the player based on zoom level
    var limit;
    switch(Engine.zoomScale){
        case 0.25:
            limit = 3;
            break;
        case 0.1:
            limit = 9;
            break;
        default:
            limit = 0;
            break;
    }
    var current = start;
    var AOIs= [start];
    for(var i = 0; i < AOIs.length; i++){
        var current = AOIs[i];
        if(Geometry.manhattan(Utils.getMacroCoordinates(start),Utils.getMacroCoordinates(current)) > limit) continue;
        var adjacent = Utils.listAdjacentAOIs(current);
        var n = adjacent.diff(AOIs);
        AOIs = AOIs.concat(n);
    }
    return AOIs;
};

Utils.listAdjacentAOIs = function(current){
    if(!World.nbChunksHorizontal){
        console.log('ERROR : Chunk data not initialized');
        return [];
    }

    var AOIs = [];
    var isAtTop = (current < World.nbChunksHorizontal);
    var isAtBottom = (current > World.lastChunkID - World.nbChunksHorizontal);
    var isAtLeft = (current%World.nbChunksHorizontal == 0);
    var isAtRight = (current%World.nbChunksHorizontal == World.nbChunksHorizontal-1);
    AOIs.push(current);
    if(!isAtTop) AOIs.push(current - World.nbChunksHorizontal);
    if(!isAtBottom) AOIs.push(current + World.nbChunksHorizontal);
    if(!isAtLeft) AOIs.push(current-1);
    if(!isAtRight) AOIs.push(current+1);
    if(!isAtTop && !isAtLeft) AOIs.push(current-1-World.nbChunksHorizontal);
    if(!isAtTop && !isAtRight) AOIs.push(current+1-World.nbChunksHorizontal);
    if(!isAtBottom && !isAtLeft) AOIs.push(current-1+World.nbChunksHorizontal);
    if(!isAtBottom && !isAtRight) AOIs.push(current+1+World.nbChunksHorizontal);
    return AOIs;
};

Utils.randomInt = function(low, high) { // [low, high[
    return Math.floor(Math.random() * (high - low) + low);
};

Utils.randomElement = function(arr){
    return arr[Math.floor(Math.random()*arr.length)];
};

function randomNorm(mean,std){
    return randomZ()*std+mean;
}

function randomZ() { // Box-Muller transform to return a random value from a reduced normal
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}


function swapElements(arr,b,c){
    var tmp = arr[b];
    arr[b] = arr[c];
    arr[c] = tmp;
}

function removeElement(v,arr){
    var idx = arr.indexOf(v);
    if(idx > -1) arr.splice(idx,1);
}

function insert(a1,a2,pos){
    a1.splice.apply(a1, [pos, 0].concat(a2));
}

Utils.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
};

function coordinatesPairToTile(coords){
    return {
        x: Math.floor(coords.x/World.tileWidth),
        y: Math.floor(coords.y/World.tileHeight)
    }
}

function coordinatesToCell(v,grid){
    return Math.floor(v/grid);
}

Array.prototype.diff = function(a) { // returns the elements in the array that are not in array a
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

function printArray(arr){
    console.log(JSON.stringify(arr));
}

if (onServer) module.exports.Utils = Utils;