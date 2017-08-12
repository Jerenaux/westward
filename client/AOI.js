function AOI(mapData){
    PIXI.Container.call(this);
    this.id = mapData.aoi || 0;
}

AOI.prototype = Object.create(PIXI.Container.prototype);
AOI.prototype.constructor = AOI;
