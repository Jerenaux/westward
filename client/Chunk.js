var layerDepth = {
    0: 0, // ground
    1: 1, // terrain
    2: 2, // stuff
    3: 5 // canopy
};

function Chunk(mapData,id,z){
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

    for(var i = 0; i < mapData.layers.length; i++){
        var data = this.fromFile ? mapData.layers[i].data : null ;
        this.layers.push([]); // will contain the tile sprites
        this.layerData.push(data); // contains the tiles ID
    }
}

Chunk.prototype.drawLayers = function(){
    for(var l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        var data = this.layerData[l];
        for (var i = 0; i < data.length; i++) {
            var tile = data[i];
            if (tile == 0 || tile == null) continue;
            var cx = i % this.width;
            var cy = Math.floor(i / this.width);
            var x = this.x + cx;
            var y = this.y + cy;
            var sprite = this.drawTile(x,y,tile,l);
            //if(sprite == undefined) console.log(sprite,x,y,tile);
            layer.push(sprite);
            Engine.addCollision(x,y,tile);
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
    if(tileset === undefined) console.log('wrong',tile,tilesetID,x,y);
    tile -= tileset.firstgid;
    var sprite = Engine.scene.add.image(x*Engine.tileWidth,y*Engine.tileHeight,tileset.name,tile);
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    sprite.depth = layerDepth[layer];
    return sprite;
};