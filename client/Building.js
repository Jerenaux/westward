/**
 * Created by Jerome on 07-10-17.
 */

var FOUNDATIONS_ID = 4;

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (id, x, y, type, settlement, built){
        var data = Engine.buildingsData[type];
        var sprite = (built ? data.sprite : Engine.buildingsData[FOUNDATIONS_ID].sprite);
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, sprite);

        this.tileX = x;
        this.tileY = y;
        this.id = id;
        this.buildingType = type;
        this.settlement = settlement;
        this.inventory = new Inventory(100);
        this.prices = {};
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.entry = data.entry;
        this.built = built;

        var collisionData = (this.built ? data : Engine.buildingsData[FOUNDATIONS_ID]);
        this.setCollisions(collisionData);
    },

    setCollisions: function(data){
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

    handleClick: function(){
        if(Engine.inMenu || Engine.player.inFight) return;
        if(!this.entry) return;
        var pos = {
            x: this.tileX + this.entry.x,
            y: this.tileY + this.entry.y
        };
        Engine.player.setDestinationAction(1,this.id); // 1 for building
        Engine.computePath(pos);
    },

    getPrice: function(id,action){
        var key = (action == 'sell' ? 0 : 1);
        return this.prices[id][key];
    }
});