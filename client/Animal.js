/**
 * Created by Jerome on 04-10-17.
 */
var Animal = new Phaser.Class({

    Extends: Moving,

    initialize: function Animal (data) { // x, y, type, id
        var animalData = Engine.animalsData[data.type];
        Moving.call(this,data.x,data.y,animalData.sprite,data.id);
        this.setFrame(animalData.frame);
        this.setDisplayOrigin(0);
        this.dead = false;
        this.name = animalData.name+' '+this.id;
        this.walkAnimPrefix = animalData.walkPrefix;
        this.restingFrames = animalData.restingFrames;
    },

    update: function(data){
        if(data.path) this.move(data.path);
        if(data.stop) this.stop();
        Engine.handleBattleUpdates(this,data);
        if(data.dead) this.die();
    },

    die: function(){
        this.setFrame(49);
        this.dead = true;
    },

    // ### INPUT ###

    handleClick: function(){
        // TODO: replace request logic
        if(Engine.dead) return;
        if(BattleManager.inBattle){
            BattleManager.processAnimalClick(this);
        }else{
            Engine.processAnimalClick(this);
        }
        Engine.interrupt = true;
    },

    handleOver: function(){
        if(BattleManager.inBattle) {
            var dx = Math.abs(this.tileX-Engine.player.tileX);
            var dy = Math.abs(this.tileY-Engine.player.tileY);
            var cursor = (dx+dy == 1 || (dx == 1 && dy == 1) ? Engine.swordCursor : Engine.bowCursor);
            Engine.setCursor(cursor);
        }
        Engine.tooltip.updateInfo((this.dead ? 'Dead ' : '')+this.name);
        Engine.tooltip.display();
    },

    handleOut: function(){
        if(BattleManager.inBattle) Engine.setCursor();
        Engine.tooltip.hide();
    }
});