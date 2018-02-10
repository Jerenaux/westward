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

    setDownFrame: function(downFrame){
        this.upFrame = this.frame.name;
        this.downFrame = downFrame;
        this.handleDown = function(){
            this.setFrame(this.downFrame)
        }
    },

    handleClick: function(){
        if(this.downFrame) this.setFrame(this.upFrame);
        if(this.menu.displayed){
            this.menu.hide();
        }else {
            this.menu.display();
        }
    },

    display: function(){
        this.setVisible(true);
    },

    hide: function(){
        this.setVisible(false);
    }
});