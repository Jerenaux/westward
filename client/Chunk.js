function Chunk(mapData,id,z){
    //Phaser.GameObjects.Sprite.call(this,Engine.scene);
    this.fromFile = (mapData !== null);
    this.id = id;
    this.z = z;
    var origin = Utils.AOItoTile(this.id);
    this.x = origin.x;
    this.y = origin.y;
    this.width = mapData.width || Engine.chunkWidth;
    this.height = mapData.height || Engine.chunkHeight;
    this.layers = [];
    this.layerData = [];
    //this.collisions = new SpaceMap();


    //this.collisions = new Proxy(new SpaceMap(),handler);


    for(var i = 0; i < Engine.nbLayers; i++){
        var data = this.fromFile ? mapData.layers[i].data : null ;
        //this.addChild(new Layer(data));
        //this.children.push(Engine.scene.add.image(this.x*Engine.tileWidth,this.y*Engine.tileHeight));
        this.layers.push([]);
        this.layerData.push(data);
    }
}

//Chunk.prototype = Object.create(Phaser.GameObjects.Sprite);
//Chunk.prototype.constructor = Chunk;

/*Chunk.prototype.checkCollision = function(tile){ // tile is a x,y pair
    var cx = tile.x - this.x;
    var cy = tile.y - this.y;
    return !!(this.collisions.get(cx,cy));*/
    /*var idx = Utils.gridToLine(cx, cy, this.width);
    for(var l = 0; l < this.layers.length; l++) {
        var data = this.layerData[l];
        if(Chunk.isColliding(data[idx])) return true;
    }
    return false;*/
//};

Chunk.prototype.drawLayers = function(){
    for(var l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        var data = this.layerData[l];
        for (var i = 0; i < data.length; i++) {
            var tile = data[i];
            if (tile == 0) continue;
            var cx = i % this.width;
            var cy = Math.floor(i / this.width);
            var x = this.x + cx;
            var y = this.y + cy;
            this.drawTile(x,y,tile,layer);
            //this.addCollision(cx,cy,tile);
            this.addCollision(x,y,tile);
        }
    }
};

Chunk.prototype.addCollision = function(x,y,tile){
    /*if(this.isColliding(tile)) this.collisions.add(cx,cy,{
        x: cx,
        y: cy,
        walkable: false
    });*/
    //if(this.isColliding(tile)) this.collisions.add(cx,cy,1);
    //if(this.isColliding(tile)) Engine.collisions.add(x,y,1);
    if(this.isColliding(tile)) Engine.collisions.add(y,x,1);
};

Chunk.prototype.isColliding = function(tile){ // tile is the index of the tile in the tileset
    for(var i = 0; i < Engine.collidingTiles.length; i++){
        if(Engine.collidingTiles[i] > tile) return false;
        if(Engine.collidingTiles[i] == tile) return true;
    }
    return false;
};

Chunk.prototype.removeLayers = function(){
    for(var l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        for(var i = 0; i < layer.length; i++){
            layer[i].destroy();
        }
    }
};

Chunk.prototype.addTile = function(x,y,tile,layer){
    if(this.fromFile) return; // original chunks cannot be tampered with
    this.children[layer].data.add(x,y,tile);
    //console.log('added '+tile+' at '+x+', '+y+' on layer '+layer);
};

Chunk.prototype.orderTiles = function(){
    for(var l = 0; l < this.children.length; l++) {
        this.children[l].children.sort(function(a,b){
            return a.tileID < b.tileID;
        });
    }
};

Chunk.prototype.drawTile = function(x,y,tile,layer){
    if(x < 0 || y < 0) return;
    var tilesetID = Engine.getTilesetFromTile(tile);
    var tileset = Engine.tilesets[tilesetID];
    tile -= tileset.firstgid;
    var sprite = Engine.scene.add.image(x*Engine.tileWidth,y*Engine.tileHeight,tileset.name,tile);
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    layer.push(sprite);
    //layer.addChild(sprite);
};

// ##############################

/*function Layer(data){
    Phaser.GameObjects.Image.call(this,Engine.scene);
    this.data = (data !== null ? data : new SpaceMap());
}

//Layer.prototype = Object.create(PIXI.Container.prototype);
Layer.prototype = Object.create(Phaser.GameObjects.Image);
Layer.prototype.constructor = Layer;*/

