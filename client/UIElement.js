/**
 * Created by Jerome on 07-10-17.
 */

var UIElement = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UIElement (x, y, texture, menu) {
        CustomSprite.call(this, x, y, texture);

        this.depth = Engine.UIDepth+1;
        this.setScrollFactor(0);
        this.setInteractive();
        //this.setDisplayOrigin(0,0);
        this.displayOriginX = 0;
        this.displayOriginY = 0;
        this.menu = menu;
    },

    handleClick: function(){
        if(this.menu.displayed){
            this.menu.hide();
        }else {
            this.menu.display();
        }
    }
});