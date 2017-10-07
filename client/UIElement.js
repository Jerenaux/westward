/**
 * Created by Jerome on 07-10-17.
 */

var UIElement = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UIElement (x, y, texture,clickCallback) {
        CustomSprite.call(this, x, y, texture);

        this.depth = Engine.UIDepth+1;
        this.setScrollFactor(0);
        this.setInteractive();
        //this.setDisplayOrigin(0,0);
        this.displayOriginX = 0;
        this.displayOriginY = 0;

        this.handleClick = clickCallback;
    }
});