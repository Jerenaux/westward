/**
 * Created by Jerome on 07-10-17.
 */

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (x, y, texture, id) {
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, texture);

        this.depth = Engine.buildingsDepth;
        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});

        this.setInteractive();
        this.setDisplayOrigin(0);
    }
});