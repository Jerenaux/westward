function Chunk(mapData,z){
    PIXI.Container.call(this);
    this.fromFile = (mapData !== null);
    this.id = mapData ? mapData.chunkID : 0;
    this.z = z;
    this.nullWarning = false;
    this.tilesWidth = mapData.width || World.chunkWidth; // "width" is reserved by PIXI

    for(var i = 0; i < mapData.layers.length; i++){
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
                if (tile === null && !this.nullWarning){
                    console.log('ALERT: null values in chunk '+this.id);
                    this.nullWarning = true;
                }
                var coord = Utils.lineToGrid(i,this.tilesWidth);
                var x = origin.x + coord.x;
                var y = origin.y + coord.y;
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
    var tileID = tile;
    var texture;
    if(Engine.textureCache.hasOwnProperty(tileID)){
        texture = Engine.textureCache[tileID];
    }else {
        var tilesetID = Engine.getTilesetFromTile(tile);
        var tileset = Engine.tilesets[tilesetID];
        tile -= tileset.firstgid;
        var wdth = Math.floor(tileset.imagewidth / Engine.tileWidth);
        var coord = Utils.lineToGrid(tile,wdth);
        //var tx = tile % wdth;
        //var ty = Math.floor(tile / wdth);
        texture = new PIXI.Texture(Engine.resources[tileset.name].texture, new PIXI.Rectangle(coord.x * Engine.tileWidth, coord.y * Engine.tileHeight, Engine.tileWidth, Engine.tileHeight));
        Engine.textureCache[tileID] = texture;
    }
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

