/**
 * Created by Jerome on 21-11-17.
 */

import UI from './UI'

var Button = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Button (x, y, frame, callback) {
        Phaser.GameObjects.Sprite.call(this, UI.scene, x, y, 'UI');
        UI.scene.add.displayList.add(this);
        UI.scene.add.updateList.add(this);

        this.setFrame(frame);
        this.normalFrame = frame;
        this.currentFrame = frame;
        this.callback = callback;
        this.enabled = true;
        this.setDisplayOrigin(0,0);
        this.setScrollFactor(0);
        this.setDepth(2);
        this.setVisible(false);
        this.setInteractive();
        this.on('pointerdown',this.handleDown.bind(this));
        this.on('pointerup',this.handleClick.bind(this));
    },

    handleDown: function(){
        if(!this.callback) return;
        if(this.enabled) this.setFrame(this.currentFrame+'-pressed');
    },

    handleClick: function(){
        if(!this.callback) return;
        if(!this.enabled){
            UI.scene.sound.add('error').play();
            return;
        }
        this.setFrame(this.currentFrame);
        this.callback();
        UI.scene.sound.add('click').play();
    },

    enable: function(){
        this.currentFrame = this.normalFrame;
        this.enabled = true;
        this.update();
    },

    disable: function(){
        this.currentFrame = 'gray';
        this.enabled = false;
        this.update();
    },

    update: function(){
        this.setFrame(this.currentFrame);
    }
});

export default Button