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
        this.tileX = x;
        this.tileY = y;
        this.chunk = Utils.tileToAOI({x: this.tileX, y: this.tileY});
        if(this.postChunkUpdate) this.postChunkUpdate();
        if(setPixelPosition) this.setPosition(this.tileX * Engine.tileWidth, this.tileY * Engine.tileHeight);
        if(isNaN(this.tileX) || isNaN(this.tileY) || isNaN(this.x) || isNaN(this.y)) console.warn('Warning: NaN coordinates for ',this.entityType,this.id);
    }
});