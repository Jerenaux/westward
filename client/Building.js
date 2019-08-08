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
        if(!data.built && buildingData.foundations) sprite = buildingData.foundations;

        this.setFrame(sprite);
        this.setVisible(true);

        //data.y++;
        this.setOrigin(0,1);
        this.setTilePosition(data.x,data.y,true);
        if(buildingData.padding) this.x -= buildingData.padding;
        this.setID(data.id);

        Engine.buildings[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        //var coll = buildingData.collisions;
        //this.coll = coll;
        this.cellsWidth = buildingData.base.width;
        this.cellsHeight = buildingData.base.height;
        this.shootFrom = buildingData.shootFrom;

        this.buildingType = data.type;
        this.owner = data.owner;
        this.ownerName = data.ownerName;
        this.civBuilding = (this.settlement == -1);
        this.inventory = new Inventory(100);
        this.countdowns = data.prodCountdowns;
        this.name = buildingData.name;//+' '+this.id;
        this.prices = {};
        this.gold = 0;
        this.built = false;
        this.locked = buildingData.locked;

        this.depthOffset = buildingData.depthOffset;
        this.setBuilt(data.built);
        this.resetDepth();
        this.setInteractiveArea();
        this.setCollisions();

        var production = buildingData.production;
        this.produced = [];
        if(production){
            production.forEach(function(prod){
                this.produced.push(parseInt(prod[0]));
            },this);
        }

        this.battleBoxData = {
            'atlas':'aok',
            'frame': buildingData.icon
        };

        if(Engine.debugCollisions) this.setAlpha(0.1);

        if(Engine.player.inBuilding == this.id) Engine.enterBuilding(this.id);
    },

    resetDepth: function(){
        this.setDepth(this.tileY-1);
    },

    setInteractiveArea: function(){
        this.setInteractive(Engine.scene.input.makePixelPerfect(250));
    },

    build: function () {
        this.built = true;
        var buildingData = Engine.buildingsData[this.buildingType];
        this.setFrame(buildingData.sprite);
        this.resetDepth();
        this.setInteractiveArea();

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
            'animation': Engine.handleBattleAnimation,
            'buildings': this.setBuildingsListing,
            'built': this.setBuilt,
            'danger': this.setDangerIcons,
            'devlevel': this.setDevLevel,
            'foodsurplus': this.setFoodSurplus,
            'gold': this.setGold,
            'hit': this.handleHit, // for HP display and blink
            'inventory': this.setInventory, // sets whole inventor
            'items': this.updateInventory, // update individual entries in inventory
            'population': this.setPopulation,
            'prices': this.setPrices,
            'prodCountdowns': this.setCountdowns,
            'productivity': this.setProductivity,
            'progress': this.setProgress,
            'ranged_atk': this.processRangedAttack,
            'rangedMiss': this.handleMiss
        };
        this.updateEvents = new Set();

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)){
                console.warn('No handler for field ',field,' for buildings');
                continue;
            }
            if(field in data) callbacks[field].call(this,data[field]);
        }

        this.updateEvents.forEach(function (e) {
            Engine.checkForBuildingMenuUpdate(this.id, e);
        }, this);
    },

    remove: function(){
        // TODO: remove collisions
        if(this.accessory) this.accessory.destroy();
        this.removeInteractive();
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
        if(Client.tutorial && flag == true) TutorialManager.triggerHook('built:'+this.id);
    },

    setCollisions: function () {
        PFUtils.buildingCollisions(this.tileX,this.tileY-this.cellsHeight,this.cellsWidth,this.cellsHeight,Engine.collisions,'add');
    },

    setCountdowns: function(countdowns){
        this.countdowns = countdowns;
        this.updateEvents.add('onUpdateShop');
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
        if(Client.tutorial) TutorialManager.checkHook();
    },

    getHPposition: function(){
        return {
            x: this.x+this.width/2,
            y: this.y
        }
    },

    handleHit: function(data){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,50,80,data.dmg,false,data.delay);
    },

    handleMiss: function(data){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,50,80,null,true,data.delay);
    },

    processRangedAttack: function(data){
        var from = {
            x: this.x + this.shootFrom.x,
            y: this.y - (this.height-this.shootFrom.y)
        }; // All coordinates are in pixels
        Engine.animateRangeAmmo('arrow',from,{x:data.x,y:data.y},this.depth+1,data.duration,data.delay);
    },

    // ### GETTERS ###

    getRect: function(){
        return {
            x: this.tileX + this.coll.x,
            y: this.tileY - this.cellsHeight,
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
        if(!(id in this.prices)) return 0;
        return this.prices[id][action];
    },

    getItemNb: function (item) {
        return this.inventory.getNb(item);
    },

    getTilePosition: function(){
        return {
            x: this.tileX,
            y: this.tileY
        }
    },

    isBuilt: function(){
        return this.built;
    },

    isDisabled: function(){
        return !this.built;
    },

    isOwned: function(){ // by the player
        // return false;
        return this.owner == Engine.player.id;
    },

    getShortID: function(){
        return 'B'+this.id;
    },

    // ### INPUT ###

    /*handleDown: function(){
        //UI.setCursor(UI.buildingCursor2);
    },*/

    findEntrance: function(){
        var closest = null;
        var minDist = Infinity;
        var minSelfDist = Infinity;
        for(var x = -1; x <= this.cellsWidth+1; x++){
            for(var y = -1; y < this.cellsHeight + 1; y++){
                var cx = this.tileX+x;
                var cy = this.tileY-this.cellsHeight+y;
                var cell = {x:cx,y:cy};
                if(Engine.checkCollision(cx,cy)) continue;
                var d = Utils.euclidean({x:Engine.player.tileX,y:Engine.player.tileY},cell);
                if(d < minDist){
                    minDist = d;
                    minSelfDist = Infinity;
                    closest = cell;
                }
            }
        }
        return closest;
    },

    handleClick: function () {
        if (Engine.inMenu && !BattleManager.inBattle || Engine.dead) return;
        if(BattleManager.inBattle){
            if(this.civBuilding) BattleManager.processEntityClick(this);
        }else{
            if(this.civBuilding){
                Client.buildingClick(this.id);
            }else {
                if(this.locked && !this.isOwned() && this.isBuilt()){
                    Engine.player.talk('That building is locked');
                    return;
                }
                var entrance = this.findEntrance();
                Engine.player.setDestinationAction(1, this.id, entrance.x, entrance.y); // 1 for building
                Engine.computePath(entrance);
            }
        }
    },

    setCursor: function(){
        if(!BattleManager.inBattle && Engine.inMenu) return;
        var cursor = null;
        if(BattleManager.inBattle) {
            if (this.civBuilding && this.built) cursor = (Utils.nextTo(Engine.player, this) ? 'melee' : Engine.player.getRangedCursor());
        }else{
            if(this.civBuilding){
                if(this.built) cursor = 'combat';
            }else{
                cursor = 'building';
            }
        }
        if(cursor) UI.setCursor(cursor);
        UI.tooltip.updateInfo('building',{id:this.id});
        UI.tooltip.display();
    },

    handleOver: function(){
        UI.manageCursor(1,'building',this);
        // this.highlight();
    },

    handleOut: function(){
        UI.manageCursor(0,'building');
        UI.tooltip.hide();
        // this.resetPipeline();
    }
});
