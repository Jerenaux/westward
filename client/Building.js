/**
 * Created by Jerome on 07-10-17.
 */

var FOUNDATIONS_ID = 4;

var Building;
Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building() {
        CustomSprite.call(this, Engine.scene, 0, 0);
        this.entityType = 'building';
    },

    setUp: function (data) {
        var buildingData = Engine.buildingsData[data.type];
        var sprite = (data.built ? buildingData.sprite : Engine.buildingsData[FOUNDATIONS_ID].sprite);
        this.setTexture(sprite);

        this.setTilePosition(data.x,data.y,true);
        this.setID(data.id);

        Engine.buildings[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.buildingType = data.type;
        this.settlement = data.sid;
        this.inventory = new Inventory(100);
        this.prices = {};
        this.entry = buildingData.entry;
        this.setBuilt(data.built);

        //var collisionData = (this.built ? data : Engine.buildingsData[FOUNDATIONS_ID]);
        //this.setCollisions(collisionData);
        this.setCollisions(buildingData);
    },

    build: function () {
        this.setBuilt(true);
        this.setTexture(Engine.buildingsData[this.buildingType].sprite);
        this.setOrigin(0.5);
        this.setTilePosition(this.tx,this.ty,true);
    },

    update: function (data) {
        var callbacks = {
            'buildings': this.setBuildingsListing,
            'foodsurplus': this.setFoodSurplus,
            'gold': this.setGold,
            'inventory': this.setInventory, // sets whole inventor
            'items': this.updateInventory, // update individual entries in inventory
            'population': this.setPopulation,
            'prices': this.setPrices,
            'progress': this.setProgress
        };
        this.updateEvents = new Set();

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }

        if (data.danger) {
            this.danger = data.danger;
            this.updateEvents.add('onUpdateMap');
        }

        if (data.productivity) {
            this.prod = data.productivity;
            this.updateEvents.add('onUpdateConstruction');
            this.updateEvents.add('onUpdateProductivity');
        }
        if (data.built) {
            if (data.built == true && !this.isBuilt()) this.build();
            if (Engine.inThatBuilding(this.id)) {
                Engine.exitBuilding();
                Engine.enterBuilding(this.id);
            }
        }

        if (data.committed) {
            this.committed = data.committed;
            this.updateEvents.add('onUpdateProductivity');
        }

        this.updateEvents.forEach(function (e) {
            Engine.checkForBuildingMenuUpdate(this.id, e);
        }, this);
    },

    remove: function(){
        // TODO: remove collisions
        CustomSprite.prototype.remove.call(this);
        delete Engine.buildings[this.id];
    },

    // ### SETTERS ###

    setBuildingsListing: function(buildings){
        this.buildings = buildings;
        this.updateEvents.add('onUpdateBuildings');
    },

    setBuilt: function(flag){
        this.built = flag;
    },

    setCollisions: function (data) {
        var shape = new Phaser.Geom.Polygon(data.shape);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

        var center = true;
        var spriteX, spriteY;
        if (center) {
            spriteX = this.tx - Math.ceil((data.width / 2) / World.tileWidth);
            spriteY = this.ty - Math.ceil((data.height / 2) / World.tileHeight);
            this.setDepth(Engine.buildingsDepth + this.ty / 1000);
        } else {
            this.setDisplayOrigin(0);
            this.setDepth(Engine.buildingsDepth + (this.ty + ((data.height / 2) / 32)) / 1000);
            spriteX = this.tx;
            spriteY = this.ty;
        }
        PFUtils.collisionsFromShape(shape.points, spriteX, spriteY, data.width, data.height, Engine.collisions);
    },

    setFoodSurplus: function(foodsurplus){
        this.foodsurplus = foodsurplus;
        this.updateEvents.add('onUpdateSettlementStatus');
    },

    setGold: function(gold){
        this.gold = gold;
        this.updateEvents.add('onUpdateShopGold');
    },

    setInventory: function(inventory){
        this.inventory.fromList(inventory);
        this.updateEvents.add('onUpdateShop');
    },

    setPopulation: function(population){
        this.population = population;
        this.updateEvents.add('onUpdateSettlementStatus');
    },

    setPrices: function(prices){
        this.prices = prices;
        this.updateEvents.add('onUpdateShop');
    },

    setProgress: function(progress){
        this.progress = progress;
        this.updateEvents.add('onUpdateConstruction');
    },

    updateInventory: function(items){
        this.inventory.updateItems(items);
        this.updateEvents.add('onUpdateShop');
    },

    // ### GETTERS ###

    getFoodSurplus: function(){
        return this.foodsurplus;
    },

    getPopulation: function(){
        return this.population;
    },

    getPrice: function (id, action) {
        var key = (action == 'sell' ? 0 : 1);
        return this.prices[id][key];
    },

    getItemNb: function (item) {
        return this.inventory.getNb(item);
    },

    getTilePosition: function(){
        return {
            x: this.tx,
            y: this.ty
        }
    },

    isBuilt: function(){
        return this.built;
    },

    // ### INPUT ###

    handleClick: function () {
        if (Engine.inMenu || Engine.player.inFight || Engine.dead) return;
        if (!this.entry) return;
        var pos = {
            x: this.tx + this.entry.x,
            y: this.ty + this.entry.y
        };
        Engine.player.setDestinationAction(1, this.id); // 1 for building
        Engine.computePath(pos);
    },

    handleOver: function(){
        if(BattleManager.inBattle || Engine.inMenu) return;
        UI.setCursor(UI.buildingCursor);
    },

    handleOut: function(){
        UI.setCursor();
    }
});