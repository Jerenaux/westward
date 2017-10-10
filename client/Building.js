/**
 * Created by Jerome on 07-10-17.
 */

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (x, y, type, id) {
        var data = Engine.buildingsData[type];
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, data.sprite);

        this.tileX = x;
        this.tileY = y;
        this.depth = Engine.buildingsDepth;
        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});

        var shape = new Phaser.Geom.Polygon(data.shape);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
        this.setDisplayOrigin(0);

        for(var x = 0; x < data.width; x += Engine.tileWidth){
            var px = x + Engine.tileWidth/2;
            for(var y = 0; y < data.height; y += Engine.tileHeight) {
                var py = y + Engine.tileHeight/2;
                if(Phaser.Geom.Polygon.Contains(shape,x,y)){
                    var wx = this.tileX + x/Engine.tileWidth;
                    var wy = this.tileY + y/Engine.tileHeight;
                    //console.log('found collision at ',wx,wy);
                    //console.log(this.x,this.y,x,y);
                    Engine.collisions.add(wy,wx,1);
                }
            }
        }
    }
});