/**
 * Created by Jerome on 29-09-17.
 */
var onServer = (typeof window === 'undefined');

if(onServer){
    var Utils = require('./Utils.js').Utils;
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
    var d = Utils.euclidean({
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

PFUtils.buildingCollisions = function(tx,ty,data,collisionMap){
    var coll = data.collisions;

    for(var x = tx + coll.x; x < tx + coll.x + coll.w; x++){
        for(var y = ty + coll.y; y < ty + coll.y + coll.h; y++) {
            collisionMap.add(x,y);
            if(!onServer && Engine.debugCollisions) Engine.scene.add.rectangle((x*32)+16,(y*32)+16, 32,32, 0xffa500).setAlpha(0.7).setDepth(100);
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


if (onServer) module.exports.PFUtils = PFUtils;