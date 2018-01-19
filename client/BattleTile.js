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
        CustomSprite.call(this, x, y, '3grid');
        
        this.setDepth(Engine.markerDepth);
        this.setDisplayOrigin(0,0);
        this.setAlpha(0.5);
        this.setInteractive();
        this.baseFrame = 0;
    },

    setUp: function(x,y){
        this.setPosition(x*32,y*32);
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.tx = x;
        this.ty = y;
        this.setVisible(true);
        this.dist = Utils.euclidean({
            x: x,
            y: y
        },{
            x: Engine.player.tileX,
            y: Engine.player.tileY
        });

        if(this.dist <= 3){
            this.baseFrame = 2;
            this.setFrame(this.baseFrame);
        }
    },

    handleOver: function(){
        this.setFrame(1);
    },

    handleOut: function(){
        this.setFrame(this.baseFrame);
    },

    handleClick: function(event){
        Engine.requestBattleMove(event);
    }
});