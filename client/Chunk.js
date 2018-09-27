var layerDepth = { // maps layer id to depth
    0: 0, // ground
    1: 1, // terrain
    2: 2, // stuff
    3: 5, // canopy
    4: 6, // overlap
    5: 7,
    6: 8
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
    var grass = [258,259,274,275];
    if(Engine.skipGrass) this.grass = Engine.scene.add.image(this.x*32,this.y*32,'grass'); // TODO: pool of grass
    for(var l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        var data = this.layerData[l];
        for (var i = 0; i < data.length; i++) {
            var tile = data[i];
            if(Engine.skipGrass && grass.includes(tile)) continue; // TODO: improve
            if (tile == 0 || tile == null) continue;
            var coord = Utils.lineToGrid(i,this.width);
            var x = this.x + coord.x;
            var y = this.y + coord.y;
            var sprite = this.drawTile(x,y,tile,l);
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
    if(Engine.skipGrass) this.grass.destroy();
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
    var sprite;

    if(Engine.useBlitters) {
        var blitter;
        if (tilesetID == 1) blitter = Engine.blitters[0];
        if (tilesetID == 2 && layer == 1) blitter = Engine.blitters[1];
        if (tilesetID == 2 && layer > 1) blitter = Engine.blitters[2];
        sprite = blitter.create(x * Engine.tileWidth, y * Engine.tileHeight, tile);
    }else {
        sprite = Engine.scene.add.image(x*Engine.tileWidth,y*Engine.tileHeight,tileset.name,tile);
        sprite.setDisplayOrigin(0,0);
        sprite.tileID = tile;
        //sprite.depth = layerDepth[layer];
        if(layer >= 3){
            sprite.setDepth(2+(y+layer)/1000);
        }else{
            sprite.setDepth(layerDepth[layer]);
        }
    }
    return sprite;
};