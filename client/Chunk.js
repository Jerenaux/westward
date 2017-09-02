function Chunk(mapData,z){
    PIXI.Container.call(this);
    this.id = mapData ? mapData.chunkID : 0;
    this.z = z;
    this.layers = {
        ground: new SpaceMap(),
        terrain: new SpaceMap(),
        stuff: new SpaceMap(),
        canopy: new SpaceMap()
    }
}

Chunk.prototype = Object.create(PIXI.Container.prototype);
Chunk.prototype.constructor = Chunk;
