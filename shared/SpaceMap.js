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
    if(object === undefined) object = 1;
    this[x][y] = object; // replaces any existing object
};

SpaceMap.prototype.accumulate = function(x,y,object,cb){
    if(!this.hasOwnProperty(x))this[x] = {};
    if(object === undefined) object = 1;
    if(this[x][y]){
        cb.call(this[x][y]);
    }else{
        this[x][y] = object;
    }
};

SpaceMap.prototype.increment = function(x,y){
    if(!this.hasOwnProperty(x))this[x] = {};
    if(!this[x].hasOwnProperty(y)) this[x][y] = 0;
    this[x][y]++;
    return this[x][y];
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

SpaceMap.prototype.getFirst = function(){
    return this.toList()[0].v;
};

SpaceMap.prototype.toList = function(compact,skipv){ // serialize to a list representation
    var list = [];
    for(var x in this){
        if(this.hasOwnProperty(x)){
            for(var y in this[x]){
                if(this[x].hasOwnProperty(y)){
                    if(compact){
                        if(skipv){
                            list.push([parseInt(x), parseInt(y)]);
                        }else {
                            list.push([parseInt(x), parseInt(y), this[x][y]]);
                        }
                    }else {
                        if(skipv){
                            list.push({
                                x: x,
                                y: y
                            });
                        }else {
                            list.push({
                                x: x,
                                y: y,
                                v: this[x][y]
                            });
                        }
                    }
                }
            }
        }
    }
    return list;
};

SpaceMap.prototype.fromList = function(list,compact) { // unserialize from list representation
    for(var i = 0; i < list.length; i++){
        var item = list[i];
        if(compact){
            this.add(item[0],item[1],(item[2] || {}))
        }else {
            this.add(item.x, item.y, (item.v || {}));
        }
    }
};

SpaceMap.prototype.toString = function(){ // serialize to a list representation
    var s = "";
    for(x in this){
        if(this.hasOwnProperty(x)){
            for(y in this[x]){
                if(this[x].hasOwnProperty(y)) {
                    s += "("+x+","+y+","+this[x][y]+")";
                }
            }
        }
    }
    return s;
};


// ###############

function SpaceMapList(){}

SpaceMapList.prototype.add = function(x,y,object){
    if(!this.hasOwnProperty(x))this[x] = {};
    if(!this[x].hasOwnProperty(y)) this[x][y] = [];
    if(object === undefined) object = 1;
    this[x][y].push(object);
};

// Works also by calling mySpaceMap[x][y]
SpaceMapList.prototype.get = function(x,y){
    if(!this.hasOwnProperty(x)) return [];
    if(!this[x].hasOwnProperty(y)) return [];
    return this[x][y];
};

SpaceMapList.prototype.delete = function(x,y,object){
    if(!this.hasOwnProperty(x)) return;
    if(!this[x].hasOwnProperty(y)) return;
    this[x][y].splice(this[x][y].findIndex(function(e){
        return e.getShortID() == object.getShortID();
    }),1);
    if(Object.keys(this[x]).length == 0) delete this[x];
};


if (onServer) {
    module.exports.SpaceMap = SpaceMap;
    module.exports.SpaceMapList = SpaceMapList;
}