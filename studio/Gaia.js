/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Geometry = require('../client/Geometry.js').Geometry;
}

var Gaia = {};

Gaia.W = { // maps position to numerical ID
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

Gaia.Shore = { // indexes of tiles in tilesets for shores
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
    topLeftOut: 272,
    water: 292
};

var Cliff = { // indexes of tiles in tilesets for cliffs
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
    topLeftIn_top: 24,
    topLeftIn: 39,
    topLeftIn_btm: 54,
    topLeftIn_alt: 68,
    topLeftIn_altbtm: 83
};

Gaia.findTileID = function(prev,pt,next,verbose){
    var inAngle = Geometry.computeAngle(prev,pt,true);
    var outAngle = Geometry.computeAngle(pt,next,true);
    if(verbose) {
        console.log('in : '+inAngle+', out : '+outAngle);
        console.log(prev);
        console.log(next);
    }

    //console.log(inAngle+', '+outAngle);
    if(inAngle == 90 && outAngle == 180){
        return Gaia.W.topRightOut;
    }else if(inAngle == 180 && outAngle == -90){
        return Gaia.W.topLeftOut;
    }else if(inAngle == 180 && outAngle == 90){
        return Gaia.W.bottomLeftOut;
    }else if(inAngle == -90 && outAngle == 180){
        return Gaia.W.bottomRightOut;
    }else if(inAngle == -90 && outAngle == 0){
        return Gaia.W.bottomLeftIn;
    }else if(inAngle == 0 && outAngle == 90){
        return Gaia.W.bottomRightIn;
    }else if(inAngle == 180 && outAngle == 180){
        return Gaia.W.top;
    }else if(inAngle == 90 && outAngle == 90){
        return Gaia.W.right;
    }else if(inAngle == 0 && outAngle == 0){
        return Gaia.W.bottom;
    }else if(inAngle == -90 && outAngle == -90){
        return Gaia.W.left;
    }else if(inAngle == 0 && outAngle == -90) {
        return Gaia.W.topRightIn;
    }else if(inAngle == 90 && outAngle == 0){
        return Gaia.W.topLeftIn;
    }
};

if (onServer) module.exports.Gaia = Gaia;