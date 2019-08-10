/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-08-18.
 */

var NPC = new Phaser.Class({

    Extends: Moving,

    initialize: function NPC() {
        Moving.call(this,0,0);
    },

    update: function(data){
        Moving.prototype.update.call(this,data);

        var callbacks = {
            'dead': this.die,
            'path': this.queuePath
        };

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }
        this.manageOrientationPin();
    },


    // ### INPUT ###

    handleClick: function(){
        if(BattleManager.inBattle){
            if(Engine.dead) return;
            BattleManager.processEntityClick(this);
        }else{
            Engine.processNPCClick(this);
        }
    },

    setCursor: function(){
        if(!BattleManager.inBattle && Engine.inMenu) return;
        var cursor;
        if(BattleManager.inBattle) {
            if(this.dead){
                cursor = 'default';
            }else{
                cursor = (Utils.nextTo(Engine.player,this) ? 'melee' : Engine.player.getRangedCursor());
            }
        }else{
            cursor = (this.dead ? 'item' : 'combat');
        }
        UI.setCursor(cursor);
        UI.tooltip.updateInfo('NPC',{type:this.entityType, id:this.id});
        UI.tooltip.display();
    },

    handleOver: function(){
        Moving.prototype.handleOver.call(this);
        UI.manageCursor(1,'npc',this);
    },

    handleOut: function(){
        Moving.prototype.handleOut.call(this);
        UI.manageCursor(0,'npc');
        UI.tooltip.hide();
    }
});