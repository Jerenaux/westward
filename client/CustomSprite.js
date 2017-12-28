/**
 * Created by Jerome on 07-10-17.
 */

var CustomSprite = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function CustomSprite (x, y, texture) {
        //console.log(currentScene.scene, texture);
        Phaser.GameObjects.Sprite.call(this, currentScene.scene, x, y, texture);
        currentScene.scene.add.displayList.add(this);
        currentScene.scene.add.updateList.add(this);
    }
});