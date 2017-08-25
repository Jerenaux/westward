function Chunk(mapData){
    PIXI.Container.call(this);
    this.id = mapData.chunkID || 0;
}

Chunk.prototype = Object.create(PIXI.Container.prototype);
Chunk.prototype.constructor = Chunk;
