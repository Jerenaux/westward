/**
 * Created by Jerome on 26-12-16.
 */

var Utils = require('../shared/Utils.js').Utils;
var GameServer = require('./GameServer.js').GameServer;

// Parent class of all game objects : players, monsters and items (not NPC because they are not processed server-side)
function GameObject(){}

GameObject.prototype.getShortID = function(){
    return this.constructor.name[0]+this.id;
};

GameObject.prototype.setOrUpdateAOI = function(){
    var previousAOI = (this.aoi !== undefined ? this.aoi : null);
    var newAOI = Utils.tileToAOI({x:this.x,y:this.y});
    if(!GameServer.AOIs.hasOwnProperty(newAOI)){
        console.warn('Wrong AOI',newAOI,'for coordinates',this.x,',',this.y);
    }
    if(newAOI != previousAOI) {
        //console.log('['+this.constructor.name+' '+this.id+'] moving to AOI '+newAOI);
        if(previousAOI !== null) GameServer.removeFromLocation(this);
        this.aoi = newAOI;
        GameServer.addAtLocation(this);
        GameServer.handleAOItransition(this, previousAOI);
        if(this.isPlayer) this.onAOItransition(newAOI,previousAOI);
    }
};

GameObject.prototype.setProperty = function(property,value){
    // Updates a property of the object and update the AOI's around it
    //console.log(this.id+' sets '+property+' to '+value);
    this[property] = value;
    if(this.id !== undefined) this.updateAOIs(property,value);
};

GameObject.prototype.updateAOIs = function(property,value){
    // When something changes, all the AOI around the affected entity are updated
    var AOIs = Utils.listAdjacentAOIs(this.aoi);
    var category = this.constructor.name; // type of the affected game object
    var id = this.id;
    AOIs.forEach(function(aoi){
        GameServer.updateAOIproperty(aoi,category,id,property,value);
    });
};

GameObject.prototype.getAOI = function(){
    return this.aoi;
};

GameObject.prototype.setModel = function(model) {
    this.model = model;
};

GameObject.prototype.getModel = function() {
    return this.model;
};


module.exports.GameObject = GameObject;