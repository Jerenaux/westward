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

Chunk.prototype.drawLayers = function(){
    var origin = Utils.AOItoTile(this.id);
    for(var l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        if(this.fromFile){
            var data = this.layerData[l];
            for (var i = 0; i < data.length; i++) {
                var tile = data[i];
                if (tile == 0) continue;
                var x = origin.x + i % this.width;
                var y = origin.y + Math.floor(i / this.width);
                this.drawTile(x,y,tile,layer);
            }
        }else{
            var data = layer.data.toList();
            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                this.drawTile(d.x, d.y, d.v,layer);
            }
        }
    }
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

