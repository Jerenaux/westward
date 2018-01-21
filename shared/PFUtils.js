/**
 * Created by Jerome on 29-09-17.
 */
var onServer = (typeof window === 'undefined');

if(onServer){
    PF = require('./pathfinding.js');
    SpaceMap = require('./SpaceMap.js').SpaceMap;
}

var PFUtils = {
    speed: 5, // 5 tiles/sec
    maxPathLength: 36,
    battleRange: 3
};
/* The handler captures all queries to the object, be it with [] or .
 *  Since it captures queries with ., it also captures method calls.
 *  All the queries are processed by get, which checks if the key corresponds
 *  to a prototype method or not. If yes, the method is returned, and automatically
 *  called, with the initial arguments provided. If not, it checks if the key belongs to
 *  the object. If not, it returns the default value (here 0). If yes, it has to check the
 *  value of that key. If it's another object, a recursive call is needed to fetch the value
 *  in the second dimension of the array.;If not (which is the outcome of that second-level call),
 *  the result is a number which can be returned as is.
 * */

// Handlers for pathfinding grid:

/* Handles accesses to spaceMap along the 2nd dimension, eg.g. map[x][y].
 * No check for function calls is needed because those are applied on the initial map, not on what
 * has been returned from the 1st dimension (eg. map.doSth(), not map[x].doSth()). If nothing is found, a walkable
 * node is created on the fly. If a number is found, it'll be a 1, so a non-walkable node is created on the fly.
 * Then whatever is there is returned.*/
PFUtils.secondDimensionHandler = {
    get: function(target,key){
        if(target.hasOwnProperty(key)){
            if(target[key] == 1){
                target[key] = new PF.Node(parseInt(key),parseInt(target.firstDim),false);
            }
        }else{
            target[key] = new PF.Node(parseInt(key),parseInt(target.firstDim));
        }
        return target[key];
    }
};
/* Handles accesses to spaceMap along the firstDimension, e.g. map[x]
 *  It first checks for function calls. If not, then it checks if there is something at the given
 *  coordinate. If not, a enmpty object is placed there. In any case, whatever is found there is returned
 *  as a proxy to be handled by the 2nd dimension handler.
 * */
PFUtils.firstDimensionHandler = {
    get: function(target,key){ // target is the spacemap ; key is actually a coordinate, a x or a y value
        if(key in target.__proto__) {
            return target.__proto__[key];
        }else{
            if(!target.hasOwnProperty(key)) target[key] = {};
            target[key].firstDim = key; // trick to carry along what was the first dimension
            return new Proxy(target[key], PFUtils.secondDimensionHandler);
        }
    }
};

PFUtils.setup = function(supervisor){
    supervisor.collisions = new SpaceMap(); // contains 1 for the coordinates that are non-walkables
    supervisor.PFgrid = new PF.Grid(0,0); // grid placeholder for the pathfinding
    supervisor.PFfinder = PFUtils.getFinder();
    // Replaces the isWalkableAt method of the PF library
    PF.Grid.prototype.isWalkableAt = PFUtils.isWalkable;
    PF.consideredNodes = 0;
};

PFUtils.getFinder = function(){
    return new PF.AStarFinder({
        //allowDiagonal: true,  // Turn back on when approprate sprites are available
        allowDiagonal: false,
        dontCrossCorners: true
    });
};

PFUtils.isWalkable = function(x, y) {
    return this.nodes[y][x].walkable;
};

PFUtils.getDuration = function(sx,sy,ex,ey){ // Compute movement duration, units are tiles and seconds
    // v = d/t <=> t = d/v
    // v = 160px/sec
    // px/(px/sec)
    //console.log(sx+', '+sy+', '+ex+', '+ey);
    var d = PFUtils.euclidean({
        x: sx,
        y: sy
    },{
        x: ex,
        y: ey
    });
    return d/PFUtils.speed;
};

PFUtils.euclidean = function(a,b){
    return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y- b.y,2));
};

PFUtils.isInPolygon = function (polygon, x, y)  // polygon is array of points
{
    var inside = false;

    for (var i = -1, j = polygon.length - 1; ++i < polygon.length; j = i)
    {
        var ix = polygon[i].x;
        var iy = polygon[i].y;

        var jx = polygon[j].x;
        var jy = polygon[j].y;

        if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
        {
            inside = !inside;
        }
    }

    return inside;
};

PFUtils.collisionsFromShape = function(shape,tileX,tileY,width,height,map,checkOnly){ // shape is array of points
    //var collidingCells = [];
    for(var x = 0; x < width; x += 32){
        var px = x;// + 16;
        for(var y = 0; y < height; y += 32) {
            var py = y;// + 16;
            if(PFUtils.isInPolygon(shape,px,py)){
                var wx = tileX + x/32;
                var wy = tileY + y/32;
                //collidingCells.push({x:wx,y:wy});
                if(checkOnly){
                    if(map.get(wy,wx)) return false;
                }else {
                    map.add(wy, wx, 1);
                }
            }
        }
    }
    return true;
    //return collidingCells;
};

if (onServer) module.exports.PFUtils = PFUtils;