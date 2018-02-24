/**
 * Created by Jerome on 23-04-17.
 */

var onServer = (typeof window === 'undefined');

// A space map is a custom data struture, similar to a sparse 2D array. Entities are stored according to their coordinates;
// that is, two keys are needed to fetch entities, the x position and the y position. This allows fast look-up based on position,
// e.g. var objectAtSomePosition = mySpaceMap.get(x,y);
function SpaceMap(){}

SpaceMap.prototype.add = function(x,y,object){
    if(!this.hasOwnProperty(x))this[x] = {};
    if(!this[x].hasOwnProperty(y))this[x][y] = [];
    this[x][y] = object; // replaces any existing object
};

// Works also by calling mySpaceMap[x][y]
SpaceMap.prototype.get = function(x,y){
    if(!this.hasOwnProperty(x)) return null;
    if(!this[x].hasOwnProperty(y)) return null;
    return this[x][y];
};

SpaceMap.prototype.has = function(x,y){
    if(!this.hasOwnProperty(x)) return false;
    return(this[x].hasOwnProperty(y));
};

SpaceMap.prototype.delete = function(x,y){
    if(!this.hasOwnProperty(x)) return;
    if(!this[x].hasOwnProperty(y)) return;
    delete this[x][y];
    if(Object.keys(this[x]).length == 0) delete this[x];
};

SpaceMap.prototype.toList = function(){ // serialize to a list representation
    var list = [];
    for(x in this){
        if(this.hasOwnProperty(x)){
            for(y in this[x]){
                if(this[x].hasOwnProperty(y)) list.push({
                    x: x,
                    y: y,
                    v: this[x][y]
                });
            }
        }
    }
    return list;
};

SpaceMap.prototype.fromList = function(list) { // unserialize from list representation
    for(var i = 0; i < list.length; i++){
        var item = list[i];
        this.add(item.x,item.y,(item.v || {}));
    }
};

if (onServer) module.exports.SpaceMap = SpaceMap;