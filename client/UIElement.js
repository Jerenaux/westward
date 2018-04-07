/**
 * Created by Jerome on 07-10-17.
 */

var UIElement = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UIElement (x, y, texture, frame, menu) {
        CustomSprite.call(this, UI.scene, x, y, texture);
        if(frame) this.setFrame(frame);

        this.depth = Engine.UIDepth+1;
        this.setScrollFactor(0);
        this.setInteractive();
        this.setDisplayOrigin(0,0);
        this.menu = menu;

        this.on('pointerdown',this.handleClick.bind(this));
        this.on('pointerover',this.handleOver.bind(this));
        this.on('pointerout',this.handleOut.bind(this));
    },

    handleOver: function(){
        this.x -= 3;
        this.y -= 3;
        this.setScale(1.05);
    },

    handleOut: function(){
        this.x += 3;
        this.y += 3;
        this.setScale(1);
    },

    handleClick: function(){
        if(this.menu.displayed){
            if(!Engine.inBuilding) this.menu.hide();
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