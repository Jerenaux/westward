function Chunk(mapData,z){
    PIXI.Container.call(this);
    this.fromFile = (mapData !== null);
    this.id = mapData ? mapData.chunkID : 0;
    this.z = z;
    this.tilesWidth = mapData.width || World.chunkWidth; // "width" is reserved by PIXI

    for(var i = 0; i < Engine.nbLayers; i++){
        var data = this.fromFile ? mapData.layers[i].data : null ;
        this.addChild(new Layer(data));
    }
}

Chunk.prototype = Object.create(PIXI.Container.prototype);
Chunk.prototype.constructor = Chunk;

Chunk.prototype.drawLayers = function(){
    var origin = Utils.AOItoTile(this.id);
    for(var l = 0; l < this.children.length; l++) {
        var layer = this.children[l];
        if(this.fromFile){
            var data = layer.data;
            for (var i = 0; i < data.length; i++) {
                var tile = data[i];
                if (tile == 0) continue;
                var x = origin.x + i % this.tilesWidth;
                var y = origin.y + Math.floor(i / this.tilesWidth);
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
    if(!tile) return;
    var tilesetID = Engine.getTilesetFromTile(tile);
    var tileset = Engine.tilesets[tilesetID];
    tile -= tileset.firstgid;
    var wdth = Math.floor(tileset.imagewidth/Engine.tileWidth);
    var tx = tile%wdth;
    var ty = Math.floor(tile/wdth);
    var texture = new PIXI.Texture(Engine.resources[tileset.name].texture, new PIXI.Rectangle(tx*Engine.tileWidth, ty*Engine.tileHeight, Engine.tileWidth, Engine.tileHeight));
    var sprite = new PIXI.Sprite(texture);
    sprite.tileID = tile;
    sprite.position.set(x*Engine.tileWidth,y*Engine.tileHeight);
    layer.addChild(sprite);
};

// ##############################

function Layer(data){
    PIXI.Container.call(this);
    this.data = (data !== null ? data : new SpaceMap());
}

Layer.prototype = Object.create(PIXI.Container.prototype);
Layer.prototype.constructor = Layer;

