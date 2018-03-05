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
        CustomSprite.call(this, x, y, '3grid',0);
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
        this.tx = data.x;
        this.ty = data.y;
        this.chunk = Utils.tileToAOI({x:this.tx,y:this.ty});
        this.setVisible(true);
        this.update();

        Engine.battleCells[this.id] = this;
        Engine.battleCellsMap.add(this.tx,this.ty,this);
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
                x: this.tx,
                y: this.ty
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
        Engine.battleCellsMap.delete(this.tx,this.ty);
        delete Engine.battleCells[this.id];
    },

    handleOver: function(){
        if(!this.active) this.setFrame(1);
    },

    handleOut: function(){
        if(!this.active) this.setFrame(this.baseFrame);
    },

    handleClick: function(pointer){
        if(BattleManager.inBattle){
            BattleManager.processTileClick(this,pointer);
        }else{
            Engine.moveToClick(pointer);
        }
    }
});