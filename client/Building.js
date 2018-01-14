/**
 * Created by Jerome on 07-10-17.
 */

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (id, x, y, type, settlement, inv, gold,prices) {
        var data = Engine.buildingsData[type];
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, data.sprite);

        this.tileX = x;
        this.tileY = y;
        this.id = id;
        this.buildingType = type;
        this.settlement = settlement;
        this.inventory = new Inventory(100);
        this.inventory.fromList(inv);
        this.gold = gold;
        this.prices = prices || {};
        this.chunk = Utils.tileToAOI({x:x,y:y});

        this.handleClick = function(){
            if(Engine.inMenu) return;
            if(!data.entry) return;
            var pos = {
                x: x + data.entry.x,
                y: y + data.entry.y
            };
            Engine.player.setDestinationAction(1,id); // 1 for building
            Engine.computePath(pos);
        };

        var shape = new Phaser.Geom.Polygon(data.shape);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

        var center = true;
        var spriteX, spriteY;
        if(center){
            spriteX = this.tileX - Math.ceil((data.width/2)/World.tileWidth);
            spriteY = this.tileY - Math.ceil((data.height/2)/World.tileHeight);
            this.setDepth(Engine.buildingsDepth + this.tileY/1000);
        }else{
            this.setDisplayOrigin(0);
            this.setDepth(Engine.buildingsDepth + (this.tileY+((data.height/2)/32))/1000);
            spriteX = this.tileX;
            spriteY = this.tileY;
        }
        PFUtils.collisionsFromShape(shape.points,spriteX,spriteY,data.width,data.height,Engine.collisions);
    },

    getPrice: function(id,action){
        var key = (action == 'sell' ? 0 : 1);
        return this.prices[id][key];
    }
});