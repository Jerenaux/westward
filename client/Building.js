/**
 * Created by Jerome on 07-10-17.
 */

/**
 * Created by Jerome on 04-10-17.
 */
var Building = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Building (x, y, texture, id) {
        Phaser.GameObjects.Sprite.call(this, Engine.scene, x*Engine.tileWidth, y*Engine.tileHeight, texture);
        Engine.scene.add.displayList.add(this);
        Engine.scene.add.updateList.add(this);

        this.depth = Engine.buildingsDepth;
        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});

        this.setInteractive();
        //this.setDisplayOrigin(0);
        this.displayOriginX = 0;
        this.displayOriginY = 0;
    }
});