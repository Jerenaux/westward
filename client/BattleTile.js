/**
 * Created by jeren on 19-01-18.
 */
/**
 * Created by Jerome on 29-11-17.
 */

var BattleTile = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function BattleTile (x,y) {
        x = x || 0;
        y = y || 0;
        CustomSprite.call(this, Engine.scene, x, y, '3grid',0);
        this.entityType = 'cell';
        
        this.setDepth(Engine.markerDepth);
        this.setDisplayOrigin(0,0);
        this.setAlpha(0.5);
        this.setInteractive();
        this.baseFrame = 0;
        this.inRange = false;
        this.active = false;
    },

    setUp: function(data){
        this.id = data.id;
        this.setPosition(data.x*32,data.y*32);
        this.tileX = data.x;
        this.tileY = data.y;
        this.chunk = Utils.tileToAOI({x:this.tileX,y:this.tileY});
        this.setVisible(true);
        this.update();

        Engine.battleCells[this.id] = this;
        Engine.battleCellsMap.add(this.tileX,this.tileY,this);
        Engine.entityManager.addToDisplayList(this);
    },

    update: function(){
        if(BattleManager.inBattle) {
            if(BattleManager.isActiveCell(this)){
                this.activate();
                return;
            }else{
                this.deactivate();
            }

            this.dist = Utils.euclidean({
                x: this.tileX,
                y: this.tileY
            }, {
                x: Engine.player.tileX,
                y: Engine.player.tileY
            });
            this.inRange = (this.dist <= PFUtils.battleRange);
            this.baseFrame = (this.inRange ? 2 : 0);
        }else{
            this.baseFrame = 0;
        }
        this.setFrame(this.baseFrame);
    },

    activate: function(){
        if(this.active) return;
        this.active = true;
        this.setFrame(3);
        this.setAlpha(1);
    },

    deactivate: function(){
        if(!this.active) return;
        this.active = false;
        this.update();
        this.setAlpha(0.5);
    },

    remove: function(){
        CustomSprite.prototype.remove.call(this);
        Engine.battleCellsMap.delete(this.tileX,this.tileY);
        delete Engine.battleCells[this.id];
    },

    hash: function(){
        return this.tileX+"_"+this.tileY;
    },

    // ### INPUT ###

    setCursor: function(){
        // UI.setCursor();
    },

    handleOver: function(){
        // UI.manageCursor(1,'tile',this);
        if(!this.active) this.setFrame(1);
    },

    handleOut: function(){
        // UI.manageCursor(0,'tile');
        if(!this.active) this.setFrame(this.baseFrame);
    },

    handleClick: function(pointer){
        if(BattleManager.inBattle){
            BattleManager.processTileClick(this,pointer);
        }else{
            if(Engine.dead) return false;
            Engine.moveToClick(pointer);
        }
    }
});