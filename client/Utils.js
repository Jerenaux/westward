/**
 * Created by Jerome on 11-08-17.
 */

var Utils = {
    separator : '_'
};

Utils.getPreference = function(parameter,defaultValue){ // Retrieve sorting preferences for localStorage or return a default value
    var pref = localStorage.getItem(parameter);
    if(pref === null) return defaultValue;
    // The following is needed because localStorage stores as text
    if(pref == 'true') return true;
    if(pref == 'false') return false;
    return parseInt(pref);
};

/*Utils.coordToChunk = function(x,y){
    var horiz = Math.floor(x/Engine.chunkWidth);
    var vert = Math.floor(y/Engine.chunkHeight);
    return horiz+Utils.separator+vert;
};

Utils.chunkToCoord = function(chunk){
    var coords = chunk.split(Utils.separator);
    return {
        x: coords[0]*Engine.chunkWidth,
        y: coords[1]*Engine.chunkHeight
    }
};

Utils.adjacentChunks = function(chunk){
    var chunks = [];
    var coords = chunk.split(Utils.separator);
    var x = parseInt(coords[0]);
    var y = parseInt(coords[1]);
    var steps = [[0,0],[-1,0],[0,1],[1,0],[1,0],[0,-1],[0,-1],[-1,0],[-1,0]];
    for(var i = 0; i < steps.length; i++){
        x += steps[i][0];
        y += steps[i][1];
        chunks.push(x+Utils.separator+y);
    }
    return chunks;
};*/

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

// Returns the x and y offets of a chunk, in chunks, from the top left
Utils.getMacroCoordinates = function(chunk){
    return {
        x: chunk%Engine.nbChunksHorizontal,
        y: Math.floor(chunk/Engine.nbChunksHorizontal)
    }
};

/*Utils.listAdjacentChunks = function(current){
    var scope = Math.floor(1/Engine.zoomScale); // number of chunks to display along one axis based on zoom
    var delta = Math.floor(scope/2)+1; // number of chunks to substract from current to get bounds of view area
    var macro = Utils.getMacroCoordinates(current);
    //console.log(macro.x+', '+macro.y);
    var leftLimit = Math.max(macro.y*Engine.nbChunksHorizontal, current - delta); // id of the leftmost chunk of the view area
    var topLeft = Math.max(leftLimit%Engine.nbChunksHorizontal, leftLimit - delta*Engine.nbChunksHorizontal);  // if of the top left chunk of the view area
    console.log('Top corner for '+current+' : '+topLeft);
};*/

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

function coordinatesToCell(v,grid){
    return Math.floor(v/grid);
}

Array.prototype.diff = function(a) { // returns the elements in the array that are not in array a
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

function printArray(arr){
    console.log(JSON.stringify(arr));
}