/**
 * Created by Jerome on 07-10-17.
 */

var CustomSprite = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function CustomSprite (x, y, texture) {
        Phaser.GameObjects.Sprite.call(this, Engine.scene, x, y, texture);
        Engine.scene.add.displayList.add(this);
        Engine.scene.add.updateList.add(this);
    }
});