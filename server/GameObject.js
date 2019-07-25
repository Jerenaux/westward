/**
 * Created by Jerome on 26-12-16.
 */

var Utils = require('../shared/Utils.js').Utils;
var GameServer = require('./GameServer.js').GameServer;
//var Rect = require('./Rect.js').Rect;

// Parent class of all game objects : players, monsters and items (not NPC because they are not processed server-side)
function GameObject(){
    this.instance = -1;
}

GameObject.prototype.getShortID = function(){
    return this.entityCategory[0]+this.id;
};

GameObject.prototype.setOrUpdateAOI = function(){
    var previousAOI = (this.aoi !== undefined ? this.aoi : null);
    var newAOI = Utils.tileToAOI({x:this.x,y:this.y});
    if(!GameServer.AOIs.hasOwnProperty(newAOI)) console.warn('Wrong AOI',newAOI,'for coordinates',this.x,',',this.y);
    if(newAOI != previousAOI) {
        if(previousAOI !== null) GameServer.removeFromLocation(this);
        this.aoi = newAOI; // has to come after previous line
        GameServer.addAtLocation(this);
        GameServer.handleAOItransition(this, previousAOI);
        if(this.isPlayer) this.onAOItransition(newAOI,previousAOI);
    }
};

GameObject.prototype.isInVision = function(){
    return GameServer.vision.has(this.aoi);
};

GameObject.prototype.setProperty = function(property,value){
    // Updates a property of the object and update the AOI's around it
    //console.log(this.id+' sets '+property+' to '+value);
    this[property] = value;
    //if(this.id !== undefined) this.updateAOIs(property,value);
    this.updateAOIs(property,value);
};

GameObject.prototype.updateAOIs = function(property,value){
    // When something changes, all the AOI around the affected entity are updated
    var AOIs = Utils.listAdjacentAOIs(this.aoi);
    AOIs.forEach(function(aoi){
        GameServer.updateAOIproperty(aoi,this.updateCategory,this.id,this.instance,property,value);
    },this);
};

GameObject.prototype.isOfInstance = function(instance){
    return this.instance == instance;
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

GameObject.prototype.save = function(){
    if(!this.model) return;
    if(this.dblocked) return;
    if(!this.isOfInstance(-1)) return;
    this.dblocked = true;
    var _document = this;
    this.schemaModel.findById(this.model._id, function (err, doc) {
        if (err) throw err;
        if(doc === null){
            console.warn('Cannot save game object');
            return;
        }

        doc.set(_document);
        doc.save(function (err) {
            _document.dblocked = false;
            //if(err) console.warn(err);
            if(err) throw err;
            console.log(_document.entityCategory+' saved');
        });
    });
    /*this.schemaModel.findOneAndUpdate(
        {_id: this.model._id},
        //_document, // Don't apply as is, go through schema!
        {$set:this},
        {},
        function(err){
            if(err) throw err;
            console.log(_document.entityCategory+' saved')
        }
    );*/
};

GameObject.prototype.addToQT = function(){
    // console.warn('putting',this.entityCategory,this.x,this.y,this.w,this.h,this.id);
    // console.warn(GameServer.qt.get({x:0, y: 0, w: 1500, h: 1140}).length);
    this.x = parseInt(this.x);
    this.y = parseInt(this.y);
    if(this.w === undefined) this.w = this.cellsWidth - 1;
    if(this.h === undefined) this.h == this.cellsHeight - 1;
    GameServer.qt.put(this);
    // console.warn(GameServer.qt.get({x:0, y: 0, w: 1500, h: 1140}).length);
   /* console.warn('Added ',this.getShortID());
    var list = GameServer.qt.get({x:this.x-1, y: this.y-1, w: 3, h: 3});
    list.forEach(function(e){
        console.warn('ID:',e.getShortID());
        return true;
    });*/
};

GameObject.prototype.onLocationChange = function(){
    // It's ok if multiple objects have same ID, it'll
    // only match and update those with same x,y,w,h
    // console.warn('moving',this.entityCategory,this.x,this.y,this.w,this.h);
    this.x = parseInt(this.x);
    this.y = parseInt(this.y);
    GameServer.qt.update(this,'id',{x:this.x,y:this.y});
};

GameObject.prototype.onRemoveFromLocation = function(){
    // console.warn('removing',this.entityCategory,this.x,this.y,this.w,this.h);
    GameServer.qt.remove(this);
};

GameObject.prototype.trim = function(trimmed){
    trimmed.instance = this.instance;
    return trimmed;
};


module.exports.GameObject = GameObject;