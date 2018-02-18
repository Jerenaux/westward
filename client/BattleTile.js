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
        
        this.setDepth(Engine.markerDepth);
        this.setDisplayOrigin(0,0);
        this.setAlpha(0.5);
        this.setInteractive();
        this.baseFrame = 0;
        this.inRange = false;
        this.active = false;
    },

    setUp: function(x,y){
        this.setPosition(x*32,y*32);
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.tx = x;
        this.ty = y;
        this.setVisible(true);
        this.manageFrame();
    },

    manageFrame: function(){
        if(BattleManager.inBattle) {
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
        //console.log('activating ',this.tx,this.ty);
        this.active = true;
        this.setFrame(3);
        this.setAlpha(1);
        /*this.tween = Engine.scene.tweens.add(
            {
                targets: this,
                alpha: 0.2,
                duration: 500,
                //yoyo: true,
                //repeat: -1
            });*/
    },

    deactivate: function(){
        if(!this.active) return;
        //console.log('deactivating ',this.tx,this.ty);
        this.active = false;
        if(this.tween) this.tween.stop();
        this.manageFrame();
        this.setAlpha(0.5);
    },

    handleOver: function(){
        if(!this.active) this.setFrame(1);
    },

    handleOut: function(){
        if(!this.active) this.setFrame(this.baseFrame);
    },

    handleClick: function(pointer){
        BattleManager.processTileClick(this,pointer);
    }
});