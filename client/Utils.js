/**
 * Created by Jerome on 11-08-17.
 */

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
    var top = Math.floor(tile.y/Engine.AOIheight);
    var left = Math.floor(tile.x/Engine.AOIwidth);
    return (top*Engine.nbAOIhorizontal)+left;
};

Utils.AOItoTile = function(aoi){
    return {
        x : (aoi%Engine.nbAOIhorizontal)*Engine.AOIwidth,
        y : Math.floor(aoi/Engine.nbAOIhorizontal)*Engine.AOIheight
    };
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