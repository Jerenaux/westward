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
    },

    highlight: function(){
        this.setPipeline('highlight');
        var texture = this.texture.source[0];
        // this.pipeline.setFloat1('uRadius', 2.0);
        this.pipeline.setFloat4('uFrameCut', this.frame.data.cut.x,this.frame.data.cut.y,this.frame.data.cut.w,this.frame.data.cut.h);
        this.pipeline.setFloat2('uTextureSize', texture.width,texture.height);
    },

    hollow: function(){
        this.hollowed = true;
        this.setDepth(this.tileY + 5);
        this.setPipeline('hollow_'+(this.entityType == 'item' ? 'items' : 'moving'));
        var texture = this.texture.source[0];
        this.pipeline.setFloat4('uFrameCut', this.frame.data.cut.x,this.frame.data.cut.y,this.frame.data.cut.w,this.frame.data.cut.h);
        this.pipeline.setFloat2('uTextureSize', texture.width,texture.height);
    },

    unhollow: function(){
        this.hollowed = false;
        this.resetPipeline();
        this.updateDepth();
    },
});