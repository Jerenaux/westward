/**
 * Created by Jerome on 04-10-17.
 */
var Animal = new Phaser.Class({

    Extends: Moving,

    initialize: function Animal (x, y, type, id) {
        var data = Engine.animalsData[type];
        Moving.call(this,x,y,data.sprite,id);
        this.setFrame(data.frame);
        this.setDisplayOrigin(0);
        this.dead = false;
        this.name = data.name;
        this.walkAnimPrefix = data.walkPrefix;
        this.restingFrames = data.restingFrames;
    },

    die: function(){
        this.setFrame(49);
        this.dead = true;
        //Engine.deathAnimation(animal);
        //setTimeout(Engine.removeAnimal,500,animal.id);
    },

    handleClick: function(){
        // TODO: replace request logic
        if(BattleManager.inBattle){
            BattleManager.processAnimalClick(this);
        }else{
            Engine.requestBattle(Engine.player,this);
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