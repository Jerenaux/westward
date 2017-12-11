/**
 * Created by Jerome on 29-11-17.
 */


var ItemSprite = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function ItemSprite () {
        CustomSprite.call(this, 0, 0, '');

        this.setScrollFactor(0);
        this.setInteractive();
        this.setDepth(Engine.UIDepth);
    },

    setUp: function(id,data,callback){
        this.setTexture(data.atlas);
        this.setFrame(data.frame);
        this.setDisplayOrigin(Math.floor(this.frame.width/2),Math.floor(this.frame.height/2));

        this.itemID = id;
        this.name = data.name;
        this.effects = data.effects;
        this.visible = true;
        if(callback) this.handleClick = callback.bind(this);
    },

    handleOver: function(){
        Engine.tooltip.updateInfo(this.name,this.effects || {});
    }
});