/**
 * Created by Jerome on 11-08-17.
 */

var Utils = {
    separator : '_'
};

var W = { // maps position to numerical ID
    topRightOut: 0,
    top: 1,
    topLeftOut: 2,
    left: 3,
    right: 4,
    bottomRightIn: 5,
    bottomLeftOut: 6,
    bottomLeftIn: 7,
    bottom: 8,
    bottomRightOut: 9,
    topRightIn: 10,
    topLeftIn: 11
};

var Shore = { // indexes of tiles in tilesets for shores
    topRight: 249,
    top: 248,
    topLeft: 247,
    left: 268,
    bottomLeft: 289,
    bottom: 290,
    bottomRight: 291,
    right: 270,
    bottomRightOut: 250,
    bottomLeftOut: 251,
    topRightOut: 271,
    topLeftOut: 272
};

var Cliff = { // indexes of tiles in tilesets for shores
    topRightOut: 21,
    topRightOut_right: 22,
    topRightOut_top: 6,
    topRightOut_btmright: 37,
    topLeftOut: 18,
    topLeftOut_top: 3,
    topLeftOut_left: 17,
    bottomLeftIn: 77,
    bottomLeftIn_right: 78,
    bottomLeftIn_up: 62,
    bottomLeftIn_upright: 63,
    bottomLeftIn_btm: 92,
    bottomLeftIn_btmright: 93,
    bottomRightIn: 82,
    bottomRIghtIn_left: 81,
    bottomRightIn_top: 67,
    bottomRightIn_topLeft: 66,
    bottomRightIn_btmleft: 96,
    top1: 4,
    top2: 5,
    right: 52,
    bottom1: 79,
    bottom2: 80,
    left1: 32,
    left2: 47,
    topRightIn: 69,
    topRightIn_btm: 84,
    topLeftIn: 39,
    topLeftIn_top: 24,
    topLeftIn_btm: 54,
    topLeftIn_alt: 68,
    topLeftIn_altbtm: 83
};

Utils.getPreference = function(parameter,defaultValue){ // Retrieve sorting preferences for localStorage or return a default value
    var pref = localStorage.getItem(parameter);
    if(pref === null) return defaultValue;
    // The following is needed because localStorage stores as text
    if(pref == 'true') return true;
    if(pref == 'false') return false;
    return parseInt(pref);
};

Utils.tileToAOI = function(tile){ // input coords in Tiles
    if(tile.x < 0 || tile.y < 0) console.log('ALERT: negative coordinates');
    var top = Math.floor(tile.y/Engine.chunkHeight);
    var left = Math.floor(tile.x/Engine.chunkWidth);
    return (top*Engine.nbChunksHorizontal)+left;
};

Utils.AOItoTile = function(aoi){
    return {
        x : (aoi%Engine.nbChunksHorizontal)*Engine.chunkWidth,
        y : Math.floor(aoi/Engine.nbChunksHorizontal)*Engine.chunkHeight
    };
};

Utils.gridToLine = function(x,y,w){
    return (y*w)+x;
};

// Returns the x and y offets of a chunk, in chunks, from the top left
Utils.getMacroCoordinates = function(chunk){
    return {
        x: chunk%Engine.nbChunksHorizontal,
        y: Math.floor(chunk/Engine.nbChunksHorizontal)
    }
};

Utils.listVisibleAOIs = function(start){
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
    var AOIs = [];
    var isAtTop = (current < Engine.nbChunksHorizontal);
    var isAtBottom = (current > Engine.lastChunkID - Engine.nbChunksHorizontal);
    var isAtLeft = (current%Engine.nbChunksHorizontal == 0);
    var isAtRight = (current%Engine.nbChunksHorizontal == Engine.nbChunksHorizontal-1);
    AOIs.push(current);
    if(!isAtTop) AOIs.push(current - Engine.nbChunksHorizontal);
    if(!isAtBottom) AOIs.push(current + Engine.nbChunksHorizontal);
    if(!isAtLeft) AOIs.push(current-1);
    if(!isAtRight) AOIs.push(current+1);
    if(!isAtTop && !isAtLeft) AOIs.push(current-1-Engine.nbChunksHorizontal);
    if(!isAtTop && !isAtRight) AOIs.push(current+1-Engine.nbChunksHorizontal);
    if(!isAtBottom && !isAtLeft) AOIs.push(current-1+Engine.nbChunksHorizontal);
    if(!isAtBottom && !isAtRight) AOIs.push(current+1+Engine.nbChunksHorizontal);
    return AOIs;
};

function randomInt (low, high) { // [low, high[
    return Math.floor(Math.random() * (high - low) + low);
}

function randomElement(arr){
    return arr[Math.floor(Math.random()*arr.length)];
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

function clamp(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
}

function coordinatesPairToTile(coords){
    return {
        x: Math.floor(coords.x/Engine.tileWidth),
        y: Math.floor(coords.y/Engine.tileHeight)
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

function printPt(pt){
    return pt.x+', '+pt.y;
}


/*Utils.listAdjacentChunks = function(current){
 var scope = Math.floor(1/Engine.zoomScale); // number of chunks to display along one axis based on zoom
 var delta = Math.floor(scope/2)+1; // number of chunks to substract from current to get bounds of view area
 var macro = Utils.getMacroCoordinates(current);
 //console.log(macro.x+', '+macro.y);
 var leftLimit = Math.max(macro.y*Engine.nbChunksHorizontal, current - delta); // id of the leftmost chunk of the view area
 var topLeft = Math.max(leftLimit%Engine.nbChunksHorizontal, leftLimit - delta*Engine.nbChunksHorizontal);  // if of the top left chunk of the view area
 console.log('Top corner for '+current+' : '+topLeft);
 };*/