/**
 * Created by Jerome on 07-10-17.
 */

var UIElement = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UIElement (x, y, texture, frame, menu) {
        CustomSprite.call(this, x, y, texture);
        if(frame) this.setFrame(frame);

        this.depth = Engine.UIDepth+1;
        this.setScrollFactor(0);
        this.setInteractive();
        this.setDisplayOrigin(0,0);
        this.menu = menu;
    },

    handleClick: function(){
        if(this.menu.displayed){
            if(!Engine.inBuilding) this.menu.hide();
        }else {
            this.menu.display();
        }
        Engine.interrupt = true;
    },

    display: function(){
        this.setVisible(true);
    },

    hide: function(){
        this.setVisible(false);
    }
});