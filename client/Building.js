/**
 * Created by Jerome on 07-10-17.
 */

var FOUNDATIONS_ID = 4;

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (data){
        var buildingData = Engine.buildingsData[data.type];
        var sprite = (data.built ? buildingData.sprite : Engine.buildingsData[FOUNDATIONS_ID].sprite);
        CustomSprite.call(this, data.x*Engine.tileWidth, data.y*Engine.tileHeight, sprite);

        this.tileX = data.x;
        this.tileY = data.y;
        this.id = data.id;

        Engine.buildings[this.id] = this;
        Engine.displayedBuildings.add(this.id);

        this.buildingType = data.type;
        this.settlement = data.sid;
        this.inventory = new Inventory(100);
        this.prices = {};
        this.chunk = Utils.tileToAOI({x:this.tileX,y:this.tileY});
        this.entry = buildingData.entry;
        this.built = data.built;

        //var collisionData = (this.built ? data : Engine.buildingsData[FOUNDATIONS_ID]);
        //this.setCollisions(collisionData);
        this.setCollisions(buildingData);
    },

    update: function(data){
        var updateEvents = new Set();
        if(data.inventory){
            this.inventory.fromList(data.inventory);
            updateEvents.add('onUpdateShop');
        }
        if(data.gold) {
            this.gold = data.gold;
            updateEvents.add('onUpdateShopGold');
        }
        if(data.items){
            Engine.updateInventory(this.inventory,data.items);
            updateEvents.add('onUpdateShop');
        }
        if(data.prices){
            this.prices= data.prices;
            updateEvents.add('onUpdateShop');
        }
        if(data.buildings){
            this.buildings = data.buildings;
            updateEvents.add('onUpdateBuildings');
        }
        if(data.population){
            this.population = data.population;
            updateEvents.add('onUpdateSettlementStatus');
        }
        if(data.foodsurplus){
            this.foodsurplus = data.foodsurplus;
            updateEvents.add('onUpdateSettlementStatus');
        }
        if(data.danger){
            this.danger = data.danger;
            updateEvents.add('onUpdateMap');
        }
        if(data.progress){
            this.progress = data.progress;
            updateEvents.add('onUpdateConstruction');
        }
        if(data.prod){
            this.prod = data.prod;
            updateEvents.add('onUpdateConstruction');
            updateEvents.add('onUpdateProductivity');
        }
        if(data.built){
            if(data.built == true && this.built == false) this.build();
            if(Engine.inThatBuilding(this.id)){
                Engine.exitBuilding();
                Engine.enterBuilding(this.id);
            }
        }

        if(data.committed){
            this.committed = data.committed;
            updateEvents.add('onUpdateProductivity');
        }

        updateEvents.forEach(function(e){
            Engine.checkForBuildingMenuUpdate(this.id,e);
        },this);
    },

    build: function(){
        this.built = true;
        this.setTexture(Engine.buildingsData[this.buildingType].sprite);
        this.setOrigin(0.5);
        this.setPosition(this.tileX*Engine.tileWidth,this.tileY*Engine.tileHeight);
    },

    // ### SETTERS ###

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

    // ### GETTERS ###

    getPrice: function(id,action){
        var key = (action == 'sell' ? 0 : 1);
        return this.prices[id][key];
    },

    getItemNb: function(item){
        return this.inventory.getNb(item);
    },

    // ### INPUT ###

    handleClick: function(){
        if(Engine.inMenu || Engine.player.inFight || Engine.dead) return;
        if(!this.entry) return;
        var pos = {
            x: this.tileX + this.entry.x,
            y: this.tileY + this.entry.y
        };
        Engine.player.setDestinationAction(1,this.id); // 1 for building
        Engine.computePath(pos);
    }
});