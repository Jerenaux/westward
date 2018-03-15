/**
 * Created by Jerome on 07-10-17.
 */

var CustomSprite = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function CustomSprite (scene, x, y, texture) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture);
        scene.add.displayList.add(this);
        scene.add.updateList.add(this);
    },

    remove: function(){
        this.setVisible(false);
        Engine.entityManager.removeFromDisplayList(this);
        Engine.entityManager.addToPool(this);
    },

    // ### SETTERS ###

    setID: function(id){
        this.id = id;
    },

    setTilePosition: function(x,y,setPixelPosition){
        this.tx = x;
        this.ty = y;
        this.chunk = Utils.tileToAOI({x: this.tx, y: this.ty});
        if(setPixelPosition) this.setPosition(this.tx * Engine.tileWidth, this.ty * Engine.tileHeight);
    }

    /*setPosition: function(x,y){
        Phaser.GameObjects.Sprite.setPosition.call(this,x,y);

    }*/
});