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
    battleRange: 3,
    collisionMap: null
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

// Used for pathfinding in battlegrids
PFUtils.invertedSecondDimensionHandler = {
    get: function(target,key){
        //console.log('2: accessing ',key);
    if(target.firstDim < 0 || key < 0 || key > World.worldWidth || target.firstDim > World.worldHeight) {
        return new PF.Node(parseInt(key),parseInt(target.firstDim),false);
    }
    if(target.hasOwnProperty(key)){
            if(target[key] == 0){
                target[key] = new PF.Node(parseInt(key),parseInt(target.firstDim));
            }
        }else{
            target[key] = new PF.Node(parseInt(key),parseInt(target.firstDim),false);
        }
        return target[key];
    }
};
/* Handles accesses to spaceMap along the firstDimension, e.g. map[x]
 *  It first checks for function calls. If not, then it checks if there is something at the given
 *  coordinate. If not, a enmpty object is placed there. In any case, whatever is found there is returned
 *  as a proxy to be handled by the 2nd dimension handler (which one depends on the 'invert' parameter)
 * */
PFUtils.firstDimensionHandler = {
    get: function(target,key){ // target is the spacemap ; key is actually a coordinate, a x or a y value
        if(key in target.__proto__) {
            return target.__proto__[key];
        }else{
            //console.log('1: accessing ',key);
            if(!target.hasOwnProperty(key)) target[key] = {};
            target[key].firstDim = key; // trick to carry along what was the first dimension
            return new Proxy(target[key], (target.invert ? PFUtils.invertedSecondDimensionHandler : PFUtils.secondDimensionHandler));
        }
    }
};

PFUtils.setGridUp = function(grid, map, invert){
    if(invert) map.invert = true;
    grid.nodes = new Proxy(map,PFUtils.firstDimensionHandler);
};

PFUtils.setup = function(supervisor){
    supervisor.collisions = new SpaceMap(); // contains 1 for the coordinates that are non-walkables
    PFUtils.collisionMap = supervisor.collisions;

    supervisor.PFgrid = new PF.Grid(0,0); // grid placeholder for the pathfinding
    PFUtils.setGridUp(supervisor.PFgrid,supervisor.collisions);
    //supervisor.PFgrid.nodes = new Proxy(supervisor.collisions,PFUtils.firstDimensionHandler);

    supervisor.PFfinder = PFUtils.getFinder();
    // Replaces the isWalkableAt method of the PF library
    PF.Grid.prototype.isWalkableAt = PFUtils.isWalkable;
    PF.consideredNodes = 0;
    PF.inspectedNodes = [];

    PF.reset = function(){
        PF.inspectedNodes.forEach(function(node){
            node.opened = false;
            node.closed = false;
            node.parent = null;
        });
        PF.inspectedNodes = [];
    };
};

PFUtils.getFinder = function(){
    return new PF.AStarFinder({
        allowDiagonal: false,  // Turn back on when approprate sprites are available
        dontCrossCorners: true
    });
};

PFUtils.isWalkable = function(x, y) {
    return this.nodes[y][x].walkable;
};

PFUtils.checkCollision = function(x,y){
    if(!PFUtils.collisionMap[y]) return false;
    var node = PFUtils.collisionMap[y][x]; // y, then x!
    if(node === undefined) return false;
    if(node == 0) return false;
    if(node == 1) return true;
    return !node.walkable;
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

// Shortens the path so that it stops at a battlezone transition
PFUtils.trimPath = function(path,map){
    var inBattleZone = !!map.get(path[0][0],path[0][1]);
    if(inBattleZone) {
        return {
            trimmed: false,
            path: path
        };
    }
    var p = [];
    for(var i = 0; i < path.length; i++){
        p.push(path[i]);
        var flag = !!map.get(path[i][0],path[i][1]);
        if(flag != inBattleZone) break;
    }
    return {
        trimmed: (p.length != path.length),
        path: p
    };};

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
    for(var x = 0; x < width; x += 32){
        var px = x;
        for(var y = 0; y < height; y += 32) {
            var py = y;
            if(PFUtils.isInPolygon(shape,px,py)){
                var wx = tileX + x/32;
                var wy = tileY + y/32;
                if(checkOnly){
                    if(map.get(wy,wx)) return false;
                }else {
                    //console.log('adding collision at',wx,wy);
                    map.add(wy, wx, 1);
                }
            }
        }
    }
    return true;
};

if (onServer) module.exports.PFUtils = PFUtils;