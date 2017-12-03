/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    World = require('./World.js').World;
}

var Utils = {};

// ### Coordinates methodes ###

Utils.tileToAOI = function(tile){ // input coords in Tiles
    if(!World.nbChunksHorizontal) throw Error('Chunk data not initialized');
    var top = Math.floor(tile.y/World.chunkHeight);
    var left = Math.floor(tile.x/World.chunkWidth);
    return (top*World.nbChunksHorizontal)+left;
};

Utils.AOItoTile = function(aoi){
    if(!World.nbChunksHorizontal) throw Error('Chunk data not initialized');
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

// ### Quadrant-related methods ###

Utils.tileToQuadrant = function(x,y,quadW,quadH){
    if(!quadW) quadW = 10;
    if(!quadH) quadH = 10;
    var aoi = Utils.tileToAOI({x:x,y:y});
    return Utils.aoiToQuadrant(aoi,quadW,quadH);
};

Utils.aoiToQuadrant = function(aoi,quadW,quadH){
    var aoiCoords = Utils.lineToGrid(aoi,World.nbChunksHorizontal);
    var nbQuadsHorizontal = Math.ceil(World.nbChunksHorizontal/quadW);
    var top = Math.floor(aoiCoords.y/quadH);
    var left = Math.floor(aoiCoords.x/quadW);
    return (top*nbQuadsHorizontal)+left;
};

Utils.distanceToPoles = function(x,y,poles){
    var aoi = Utils.tileToAOI({x:x,y:y});
    var aoicoord = Utils.lineToGrid(aoi,World.nbChunksHorizontal);
    var dists = []; // distances (in aoi) between tile and each pole
    var sum = 0;
    for(var i = 0; i < poles.length; i++){
        var d = Utils.euclidean(
            aoicoord,
            Utils.lineToGrid(poles[i],World.nbChunksHorizontal)
        );
        if(d == 0) d = 0.1;
        sum += d;
        dists.push(d);
    }
    console.log('distances :', dists, 'sum = ',sum);

    // Revert: d' = sum/d
    var sumweights = 0;
    var weights = dists.map(function(d){
        //var w = (d > 0 ? sum/d : 1);
        var w = sum/d;
        sumweights += w;
        return w;
    });
    console.log('weights :', weights);

    // Normalize: z = d'/sum'
    var normalized = weights.map(function(w){
        return Math.round((w/sumweights)*10);
    });
    console.log('normalized :', normalized);
};


// ### General methods ###

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

Utils.euclidean = function(a,b){
    //console.log('dist between',a,b);
    return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y- b.y,2));
};

Utils.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
};

Utils.randomInt = function(low, high) { // [low, high[
    return Math.floor(Math.random() * (high - low) + low);
};

Utils.randomElement = function(arr){
    return arr[Math.floor(Math.random()*arr.length)];
};

Utils.randomNorm = function(mean,std){ // Returns a value from a normal distribution
    return randomZ()*std+mean;
};

function randomZ() { // Box-Muller transform to return a random value from a reduced normal
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

Utils.swapElements = function(arr,b,c){
    var tmp = arr[b];
    arr[b] = arr[c];
    arr[c] = tmp;
};

Utils.removeElement = function(v,arr){
    var idx = arr.indexOf(v);
    if(idx > -1) arr.splice(idx,1);
};

Utils.insert = function(a1,a2,pos){ // insert array a1 at position pos in array a2
    a1.splice.apply(a1, [pos, 0].concat(a2));
};

Utils.printArray = function(arr){
    console.log(JSON.stringify(arr));
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

if (onServer) module.exports.Utils = Utils;