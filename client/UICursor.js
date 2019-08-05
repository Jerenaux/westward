/**
 * Created by Jerome on 29-11-17.
 */
const UICursor = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UICursor() {

        CustomSprite.call(this, UI.scene, 0, 0, '');

        // this.setScrollFactor(0);
        // this.setInteractive();
        // this.setVisible(false);
        // this.setDepth(1);
        // this.showTooltip = true;

        this.setOrigin(0,0);
        this.cursor = UI.scene.add.sprite(222,222,'bombcursor');

    },

    updatePosition: function(x, y){
        this.cursor.setPosition(
            x,
            y
        );
    },

    setUp: function (id, data, callback) {
        this.setTexture(data.atlas);
        this.setFrame(data.frame);
        this.setOrigin(0.5);
        this.disabled = false;
    },

    display: function () {
        this.setVisible(true);
    },

    hide: function () {
        this.setVisible(false);
    }

});
