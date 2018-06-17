/**
 * Created by Jerome on 04-10-17.
 */
var Player = new Phaser.Class({

    Extends: Moving,

    initialize: function Player () {
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        Moving.call(this);

        this.entityType = 'player';

        this.setTexture('hero');
        this.setOrigin(0.2,0.5);
        this.firstUpdate = true;

        this.bubbleOffsetX = 55;
        this.bubbleOffsetY = 75;

        this.animPrefix = 'player';
        this.footprintsFrame = 0;
        this.printsVertOffset = 10;

        this.restingFrames = {
            up: 104,
            down: 130,
            left: 117,
            right: 143
        };
        this.setFrame(this.restingFrames.down);

        this.destinationAction = null;

        this.bubble = new Bubble(0,0);
        this.orientationPin = new OrientationPin('player');
        this.flipPrint = false;
    },

    setUp: function(data){
        this.id = data.id;
        Engine.players[this.id] = this;
        Engine.entityManager.addToDisplayList(this);
        this.setVisible(true);

        this.name = 'Player '+this.id;
        this.setPosition(data.x,data.y);
        if(this.isHero) this.updateViewRect();
        this.bubble.updatePosition(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY);

        this.manageOrientationPin();
    },

    update: function(data){
        console.log('updating player');

        if(data.x >= 0 && data.y >= 0) this.teleport(data.x,data.y);

        var callbacks = {
            'dead': this.processDeath,
            'inBuilding': this.processBuilding,
            'melee_atk': this.processMeleeAttack,
            'path': this.processPath,
            'ranged_atk': this.processRangedAttack,
            'stop': this.processStop
        };

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }

        Engine.handleBattleUpdates(this,data);
        if(!this.isHero && data.chat) this.talk(data.chat);
        this.firstUpdate = false;
    },

    remove: function(){
        CustomSprite.prototype.remove.call(this);
        this.orientationPin.hide();
        delete Engine.players[this.id];
    },

    die: function(showAnim){
        if(this.bubble) this.bubble.hide();
        if(showAnim){
            this.play(this.animPrefix+'_death');
        }else{
            this.setVisible(false);
        }
    },

    respawn: function(){
        //Engine.deathAnimation(this);
        this.setVisible(true);
    },

    endMovement: function() {
        Moving.prototype.endMovement.call(this);
        if(BattleManager.inBattle) BattleManager.onEndOfMovement();
        if(this.isHero){
            var da = this.destinationAction;
            if(da && da.type == 1) {
                var dx = Math.abs(da.x - this.tileX);
                var dy = Math.abs(da.y - this.tileY);
                if (dx <= 1 && dy <= 1){
                    Engine.enterBuilding(da.id);
                    this.setOrientation('up');
                    this.faceOrientation();
                }
            }

        }
    },

    talk: function(text){
        this.bubble.update(text);
        this.bubble.display();
        Engine.scene.sound.add('speech').play();
    },

    // ### SETTERS ####

    processBuilding: function(inBuilding){
        if(inBuilding > -1) {
            if(!this.isHero) this.setVisible(false);
            this.inBuilding = inBuilding;
        }
        if(inBuilding == -1){
            this.orientation = 'down';
            this.faceOrientation();
            if(!this.isHero) this.setVisible(true);
            this.inBuilding = inBuilding;
        }
    },

    processDeath: function(dead){
        if(dead == true) this.die(!this.firstUpdate);
        if(dead == false) this.respawn();
    },

    processMeleeAttack: function(facing){
        this.setOrientation(facing);
        this.play(this.animPrefix+'_attack_'+this.orientation);
    },

    processPath: function(path){
        if(!this.isHero) this.move(path);
    },

    processRangedAttack: function(facing){
        this.setOrientation(facing);
        this.play(this.animPrefix+'_bow_'+this.orientation);
    },

    processStop: function(stop){
        this.serverStop(stop.x,stop.y); // TODO: move to new Moving update() supermethod
    },

    setDestinationAction: function(type,id,x,y){
        //console.log('setting to',type,id);
        if(type == 0){
            this.destinationAction = null;
            return;
        }
        this.destinationAction = {
            type: type,
            id: id,
            x: x,
            y: y
        };
    },

    setOrientation: function(facing){
        this.computeOrientation(this.tileX,this.tileY,facing.x,facing.y);
        this.faceOrientation();
    },

    // ### GETTERS ####

    getEquipped: function(slot){
        return this.equipment.get(slot);
    },

    getMaxAmmo: function(slot){
        //return this.equipment.getMaxAmmo(slot);
        var container = this.equipment.get(this.equipment.getContainer(slot));
        return Engine.itemsData[container].capacity;
    },

    getNbAmmo: function(slot){
        return this.equipment.getNbAmmo(slot);
    },

    getStat: function(stat){
        return this.stats[stat];
    },

    getStatValue: function(stat){
        return this.getStat(stat).getValue();
    },

    getTilePosition: function(){
        return {
            x: this.tileX,
            y: this.tileY
        }
    },

    hasItem: function(item,nb){
        return (this.inventory.getNb(item) >= nb);
    },

    isAmmoEquipped: function(slot){
        //return this.equipment[slot][0] > -1;
        return this.equipment.hasAnyAmmo(slot);
    }
});