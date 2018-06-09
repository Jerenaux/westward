/**
 * Created by Jerome on 29-09-17.
 */
var onServer = (typeof window === 'undefined');

if(onServer){
    PF = require('./pathfinding.js');
}

var PFUtils = {
    speed: 5, // 5 tiles/sec
    battleRange: 3
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
    };
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

PFUtils.buildingCollisions = function(tx,ty,data,collisionMap){
    var coll = data.collisions;

    for(var x = tx + coll.x; x < tx + coll.x + coll.w; x++){
        for(var y = ty + coll.y; y < ty + coll.y + coll.h; y++) {
            collisionMap.add(x,y);
        }
    }

    var entrance = data.entrance;
    if(entrance) {
        for (var x = tx + entrance.x; x < tx + entrance.x + entrance.w; x++) {
            for (var y = ty + entrance.y; y < ty + entrance.y + entrance.h; y++) {
                collisionMap.delete(x, y);
            }
        }
    }
};

/*PFUtils.collisionsFromShape = function(shape,tileX,tileY,width,height,map,checkOnly){ // shape is array of points
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
                    map.add(wx, wy, 1); // /!\  x/y order
                }
            }
        }
    }
    return true;
};*/

if (onServer) module.exports.PFUtils = PFUtils;