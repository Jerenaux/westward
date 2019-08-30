import Engine from './Engine'
import {SpaceMap} from '../shared/SpaceMap'
import World from '../shared/World'

var TREE_ALPHA = 1;

function Chunk(data){
    this.id = data.id;
    this.x = parseInt(data.x);
    this.y = parseInt(data.y);
    this.defaultTile = data.default;
    this.layers = data.layers;
    this.decor = data.decor;
    this.ground = new SpaceMap();
    this.ground.fromList(this.layers[0],true); // true = compact list
    this.wood = data.wood;
    this.tiles = [];
    this.tilesMap = new SpaceMap();
    this.images = [];
    this.displayed = false;
    this.leavesPos = [[0,-1],[0,0],[0,1],[1,1],[1,0],[2,0],[2,1],[2,-1]];
    this.draw();
}

Chunk.prototype.draw = function(){
    this.wood.forEach(function(w){
        this.addResource(this.x+w[0],this.y+w[1]);
    },this);
    // Ground
    for(var x_ = 0; x_ < World.chunkWidth; x_++){
        for(var y_ = 0; y_ < World.chunkHeight; y_++) {
            var tx = this.x + x_;
            var ty = this.y + y_;
            if(this.hasWater(tx,ty)) continue;
            if(this.defaultTile == 'grass') {
                var gs = Engine.tilesetData.config.grassSize;
                var t = (tx % gs) + (ty % gs) * gs;
                this.drawTile(tx,ty,Engine.tilesetData.config.grassPrefix+'_'+t);
            }
        }
    }
    // Layers
    this.layers.forEach(function(layer){
        layer.forEach(function(data){
            var tile = data[2];
            if(tile === undefined) return;
            var x = this.x + parseInt(data[0]);
            var y = this.y + parseInt(data[1]);
            var name = Engine.tilesetData.shorthands[tile];
            if(!(tile in Engine.tilesetData.shorthands)) return;
            this.drawTile(x, y, name);
        },this);
    },this);
    if(this.tiles.length > 700) console.warn(this.tiles.length); // TODO: remove eventually

    // Decor
    this.decor.forEach(function (data) {
        var x = this.x + parseInt(data[0]);
        var y = this.y + parseInt(data[1]);
        this.addImage(x, y, data[2]);
        if(data[2][0] == 't') this.addOverlay(x,y);
    }, this);

    this.displayed = true;
};

Chunk.prototype.has = function(x,y,v){
    var cx = x - this.x;
    var cy = y - this.y;
    return (this.ground.get(cx,cy) == v);
};

Chunk.prototype.hasWater = function(x,y){
    return this.has(x,y,'w');
};

Chunk.prototype.drawTile = function(x,y,tile){
    /*if(BLIT){ // TODO: remove?
        Editor.ground.create(x * World.tileWidth, y * World.tileHeight, tile);
        return;
    }*/
    var sprite = Engine.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',tile);
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    this.tiles.push(sprite);
    if(this.getAtlasData(tile,'collides',true)) this.addCollision(x,y);
    this.postDrawTile(x,y,tile,sprite);
};

Chunk.prototype.getAtlasData = function(image,data,longname){
    if(longname){
        return Engine.tilesetData.atlas[image][data];
    }else {
        if (!(image in Engine.tilesetData.shorthands)){
            console.warn('Unknown shorthand',image);
            return false;
        }
        return Engine.tilesetData.atlas[Engine.tilesetData.shorthands[image]][data];
    }
};

Chunk.prototype.drawImage = function(x,y,image,depth,crop){
    var offset = this.getAtlasData(image,'offset');
    if(offset){
        x += offset.x;
        y += offset.y;
    }
    var img = Engine.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',Engine.tilesetData.shorthands[image]);
    if(crop) img.setCrop(crop);
    var depthOffset = this.getAtlasData(image,'depthOffset') || 0;
    depth = depth || y;
    img.setDepth(depth+depthOffset);
    var anchor = this.getAtlasData(image,'anchor');
    img.setOrigin(anchor.x,anchor.y);
    this.images.push(img);
    this.postDrawImage(x,y,image,img);
    return img;
};

Chunk.prototype.addImage = function(x,y,image){
    var isTree = (image[0] == 't');
    if(isTree){
        var frame = this.getAtlasData(image,'frame');
        var ycutoff = frame.h*0.4;
        this.drawImage(x,y,image, y, new Phaser.Geom.Rectangle(0,0,frame.w,ycutoff)).setAlpha(TREE_ALPHA);
        this.drawImage(x,y,image, y+1, new Phaser.Geom.Rectangle(0,ycutoff,frame.w,frame.h-ycutoff)).setAlpha(TREE_ALPHA);
    }else{
        this.drawImage(x,y,image);
    }
    // Manage collisions
    var collisions = this.getAtlasData(image,'collisions');
    if(collisions) {
        collisions.forEach(function(coll){
            this.addCollision(x+coll[0],y+coll[1]);
        },this);
    }
    // Draw dead leaves on the ground
    if(isTree && Utils.randomInt(1,10) > 6){ // TODO: conf
        var nbleaves = 5; //TODO: conf
        Utils.shuffle(this.leavesPos);
        for(var j = 0; j < nbleaves; j++) {
            var c = this.leavesPos[j];
            var type = Utils.randomInt(1,3);
            var lx = x+c[0];
            var ly = y+c[1];
            this.drawImage(lx,ly,'l'+type);
            // if(this.hasWater(lx,ly)) console.warn('on water');
        }
    }
    // Add ivy
    if(isTree && (image[1] == 1 || image[1] == 2) && Utils.randomInt(1,10) > 6){ // TODO: conf
        this.drawImage(x+1,y-1,'i'+Utils.randomInt(1,2),y+1);
    }
};

Chunk.prototype.addOverlay = function(cx,cy){
    if(!Engine) return;
    Engine.overlay.add(cx-1, cy-2, 1);
    Engine.overlay.add(cx, cy-2, 1);
    Engine.overlay.add(cx+1, cy-2, 1);
    Engine.overlay.add(cx+2, cy-2, 1);
    Engine.overlay.add(cx, cy-3, 1);
    Engine.overlay.add(cx+1, cy-3, 1);
};

Chunk.prototype.addCollision = function(cx,cy){
    Engine.collisions.add(cx, cy, 1);
};

Chunk.prototype.addResource = function(x,y){
    Engine.resources.add(x,y);
};

Chunk.prototype.erase = function(){
    for(var x = this.x; x < this.x + World.chunkWidth; x++){
        for(var y = this.y; y < this.y + World.chunkHeight; y++){
            Engine.collisions.delete(x,y);
        }
    }
    this.tiles.forEach(function(tile){
        tile.destroy();
    });
    this.images.forEach(function(image){
        image.destroy();
    });
};

Chunk.prototype.postDrawTile = function(){}; // Used in editor
Chunk.prototype.postDrawImage = function(x,y,image,sprite){
    var hover = this.getAtlasData(image,'hover');
    if(!hover) return;
    sprite.id = 0;
    sprite.tx = Math.floor(x);
    sprite.ty = Math.floor(y);
    sprite.setInteractive();
    sprite.on('pointerover',function(){
        UI.hoverFlower++;
        sprite.formerFrame = sprite.frame.name;
        sprite.setFrame(hover);
        Engine.hideMarker();
        UI.setCursor('item'); // TODO: use UI.manageCursor() instead?
    });
    sprite.on('pointerout',function(){
        UI.hoverFlower--;
        sprite.setFrame(sprite.formerFrame);
        if(UI.hoverFlower <= 0) {
            Engine.showMarker();
            UI.setCursor();
        }
    });
    sprite.on('pointerdown',function(){
        if(!BattleManager.inBattle) Engine.processItemClick(sprite,true);
    });
};

export default Chunk