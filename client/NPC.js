/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-08-18.
 */

var NPC = new Phaser.Class({

    Extends: Moving,

    initialize: function NPC() {
        Moving.call(this,0,0);
    },

    update: function(data){
        // TODO: use callback map like others
        if(data.path) this.queuePath(data.path);
        if(data.stop) this.serverStop(data.stop.x,data.stop.y); // TODO: move to new Moving update() supermethod
        if(data.melee_atk) {
            this.computeOrientation(this.tileX,this.tileY,data.melee_atk.x,data.melee_atk.y);
            this.faceOrientation();
            this.onAttack();
        }
        Engine.handleBattleUpdates(this,data);
        if(data.dead) this.die();
    },

    // ### INPUT ###

    handleClick: function(){
        if(BattleManager.inBattle){
            if(Engine.dead) return;
            BattleManager.processNPCClick(this);
        }else{
            Engine.processNPCClick(this);
        }
    },

    setCursor: function(){
        if(!BattleManager.inBattle && Engine.inMenu) return;
        if(BattleManager.inBattle) {
            var dx = Math.abs(this.tileX-Engine.player.tileX);
            var dy = Math.abs(this.tileY-Engine.player.tileY);
            var cursor = (this.dead ? 'cursor' : (dx+dy == 1 || (dx == 1 && dy == 1) ? 'melee' : Engine.player.getRangedCursor()));
            UI.setCursor(cursor);
        }else{
            var cursor = (this.dead ? 'item' : 'combat');
            UI.setCursor(cursor);
        }
        UI.tooltip.updateInfo((this.dead ? 'Dead ' : '')+this.name);
        UI.tooltip.display();
    },

    handleOver: function(){
        UI.manageCursor(1,'npc',this);
    },

    handleOut: function(){
        UI.manageCursor(0,'npc');
        UI.tooltip.hide();
    }
});