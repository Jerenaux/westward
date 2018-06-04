/**
 * Created by Jerome on 29-11-17.
 */


var ItemSprite = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function ItemSprite (x,y) {
        x = x || 0;
        y = y || 0;
        CustomSprite.call(this, UI.scene, x, y, '');

        this.setScrollFactor(0);
        this.setInteractive();
        this.setVisible(false);
        this.setDepth(1);
        this.showTooltip = true;

        this.on('pointerover',this.handleOver.bind(this));
    },

    setUp: function(id,data,callback){
        this.setTexture(data.atlas);
        this.setFrame(data.frame);
        this.setDisplayOrigin(Math.floor(this.frame.width/2),Math.floor(this.frame.height/2));

        this.itemID = id;
        this.name = data.name;
        this.desc = data.desc;
        this.effects = data.effects;
        this.disabled = false;
        if(callback) {
            this.off('pointerup');
            this.on('pointerup',callback.bind(this));
        }
    },

    disable: function(){
        if(this.disabled) return;
        this.disabled = true;
        this.setTexture(this.texture.key+'_gr',this.frame.name);
        this.off('pointerup');
    },

    display: function(){
        this.setVisible(true);
    },

    hide: function(){
        this.setVisible(false);
    },

    handleOver: function(){
        if(this.showTooltip) UI.tooltip.updateInfo(this.name,this.desc,this.itemID);
    }
});