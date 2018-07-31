/**
 * Created by Jerome on 07-10-17.
 */

// Class for icons of the UI tray
var UIElement = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UIElement (x, y, menu, frame) {
        CustomSprite.call(this, UI.scene, x, y, 'trayicons');
        this.setFrame(frame);

        this.depth = Engine.UIDepth+1;
        this.setScrollFactor(0);
        this.setInteractive();
        this.menu = menu;

        this.on('pointerdown',this.handleClick.bind(this));
        this.on('pointerover',this.handleOver.bind(this));
        this.on('pointerout',this.handleOut.bind(this));
    },

    handleOver: function(){
        UI.manageCursor(1,'UI');
        var trayFrames = Engine.scene.textures.list['trayicons'].frames;
        var hoverFrame = this.frame.name+'_hover';
        if(trayFrames.hasOwnProperty(hoverFrame)){
            this.initialFrame = this.frame.name;
            this.setFrame(hoverFrame);
        }
    },

    handleOut: function(){
        UI.manageCursor(0,'UI');
        if(this.initialFrame) this.setFrame(this.initialFrame);
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