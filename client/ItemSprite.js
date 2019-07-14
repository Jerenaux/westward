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
        this.setOrigin(0.5);

        this.itemID = id;
        this.slot = data.slot;
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
        if(this.showTooltip) {
            if(this.itemID == -1){
                UI.tooltip.updateInfo('slot', {slot: this.slot});
            }else {
                UI.tooltip.updateInfo('item', {id: this.itemID});
            }
        }
    }
});