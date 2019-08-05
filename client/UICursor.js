/**
 * Created by Jerome on 29-11-17.
 */
const UICursor = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function UICursor() {

        CustomSprite.call(this, UI.scene, 0, 0, 'bombcursor');

        this.setDepth(10);
        this.setOrigin(0,0);

    },

    updatePosition: function(x, y){
        this.setPosition(
            x,
            y
        );
    },

    changeCursor: function(cursor){
        // Nothing here for now
    },

    display: function () {
        this.setVisible(true);
    },

    hide: function () {
        this.setVisible(false);
    }

});
