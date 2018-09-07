/**
 * Created by Jerome on 07-10-17.
 */

var FOUNDATIONS_ID = 4;

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building() {
        CustomSprite.call(this, Engine.scene, 0, 0, 'buildings_sprites');
        this.entityType = 'building';
    },

    setUp: function (data) {
        var buildingData = Engine.buildingsData[data.type];
        var sprite = buildingData.sprite;
        if(!data.built) sprite += '_construction';

        //this.setTexture(sprite);
        this.setFrame(sprite);
        this.setVisible(true);

        data.y++;
        this.setOrigin(0,1);
        this.setTilePosition(data.x,data.y,true);
        this.setID(data.id);

        Engine.buildings[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        var coll = buildingData.collisions;
        this.cellsWidth = coll.w;
        this.cellsHeight = coll.h;

        this.buildingType = data.type;
        this.settlement = data.sid;
        this.civBuilding = (this.settlement == -1);
        this.inventory = new Inventory(100);
        this.name = buildingData.name+' '+this.id;
        this.prices = {};
        this.built = false;
        if(buildingData.entrance) {
            this.entrance = {
                x: this.tx + buildingData.entrance.x,
                y: this.ty + buildingData.entrance.y
            };
        }

        this.depthOffset = buildingData.depthOffset;
        this.setBuilt(data.built);
        this.resetDepth();

        if(buildingData.shape) {
            var shape = new Phaser.Geom.Polygon(buildingData.shape);
            this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
            this.input.hitArea = shape; // will override previous interactive zone, if any (e.g. if object recycled from pool)

            //this.on('pointerover',this.handleOver.bind(this));
        }

        this.setCollisions(buildingData);
    },

    resetDepth: function(){
        this.setDepth(Engine.buildingsDepth + (this.ty - this.depthOffset)/1000);
    },

    build: function () {
        this.built = true;
        var buildingData = Engine.buildingsData[this.buildingType];
        this.setFrame(buildingData.sprite);
        this.resetDepth();

        if(buildingData.accessory){
            this.accessory = Engine.scene.add.sprite(
                this.x+buildingData.accessory.x,
                this.y+buildingData.accessory.y,
                'buildings_sprites',
                buildingData.accessory.frame
            );
            this.accessory.setDepth(this.depth);
            Engine.scene.tweens.add(
                {
                    targets: this.accessory,
                    angle: '+=360',
                    duration: 10000,
                    repeat: -1
                });
        }
    },

    unbuild: function(){
        this.built = false;
        var buildingData = Engine.buildingsData[this.buildingType];
        this.setFrame(buildingData.sprite+'_construction');
        this.resetDepth();
        if(this.accessory) this.accessory.destroy();
    },

    update: function (data) {
        var callbacks = {
            'buildings': this.setBuildingsListing,
            'built': this.setBuilt,
            'committed': this.setCommitted,
            'danger': this.setDangerIcons,
            'devlevel': this.setDevLevel,
            'foodsurplus': this.setFoodSurplus,
            'gold': this.setGold,
            'hit': this.handleHit, // for HP display and blink
            'inventory': this.setInventory, // sets whole inventor
            'items': this.updateInventory, // update individual entries in inventory
            'population': this.setPopulation,
            'prices': this.setPrices,
            'productivity': this.setProductivity,
            'progress': this.setProgress,
            'rangedMiss': this.handleMiss
        };
        this.updateEvents = new Set();

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }

        this.updateEvents.forEach(function (e) {
            Engine.checkForBuildingMenuUpdate(this.id, e);
        }, this);
    },

    remove: function(){
        // TODO: remove collisions
        if(this.accessory) this.accessory.destroy();
        CustomSprite.prototype.remove.call(this);
        delete Engine.buildings[this.id];
    },

    // ### SETTERS ###

    setBuildingsListing: function(buildings){
        this.buildings = buildings;
        this.updateEvents.add('onUpdateBuildings');
    },

    setBuilt: function(flag){
        if (flag == true && !this.isBuilt()) this.build();
        if  (flag == false && this.isBuilt()) this.unbuild();

        if (Engine.inThatBuilding(this.id)) {
            Engine.exitBuilding();
            Engine.enterBuilding(this.id);
        }
    },

    setCollisions: function (data) {
        PFUtils.buildingCollisions(this.tx,this.ty,data,Engine.collisions);
    },

    setCommitted: function(committed){
        this.committed = committed;
        this.updateEvents.add('onUpdateProductivity');
    },

    setDangerIcons: function(danger){
        this.danger = danger;
        this.updateEvents.add('onUpdateMap');
    },

    setDevLevel: function(level){
        this.devlevel = level;
        this.updateEvents.add('onUpdateSettlementStatus');
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

    setProductivity: function(productivity){
        this.prod = productivity;
        this.updateEvents.add('onUpdateConstruction');
        this.updateEvents.add('onUpdateProductivity');
    },

    updateInventory: function(items){
        this.inventory.updateItems(items);
        this.updateEvents.add('onUpdateShop');
    },

    getHPposition: function(){
        return {
            x: this.x+this.width/2,
            y: this.y
        }
    },

    handleHit: function(dmg){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,50,80,dmg,false);
    },

    handleMiss: function(){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,50,80,null,true);
    },

    // ### GETTERS ###

    getBattleRect: function(){
        return {
            x: this.x + coll.x,
            y: this.y - this.cellsHeight,
            w: this.cellsWidth,
            h: this.cellsHeight
        }
    },

    getDevLevel: function(){
        return this.devlevel;
    },

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

    handleDown: function(){
        //UI.setCursor(UI.buildingCursor2);
    },


    handleClick: function () {
        if(this.civBuilding) return;
        if (Engine.inPanel || Engine.inMenu || BattleManager.inBattle || Engine.dead) return;
        if (!this.entrance) return;
        Engine.player.setDestinationAction(1, this.id, this.entrance.x, this.entrance.y); // 1 for building
        Engine.computePath(this.entrance);
        //Client.buildingClick(this.id);
    },

    setCursor: function(){
        if(BattleManager.inBattle || Engine.inMenu) return;
        var cursor;
        if(this.civBuilding){
            if(this.built){
                cursor = 'combat';
            }else{
                return;
            }
        }else{
            cursor = 'building';
        }
        UI.setCursor(cursor);
        UI.tooltip.updateInfo(this.name);
        UI.tooltip.display();
    },

    handleOver: function(){
        UI.manageCursor(1,'building',this);

    },

    handleOut: function(){
        UI.manageCursor(0,'building');
        UI.tooltip.hide();
    }
});