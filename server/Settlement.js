/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-02-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Formulas = require('../shared/Formulas.js').Formulas;
var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;

function Settlement(data){
    this.id = data.id;
    this.name = data.name;
    this.desc = data.description;
    this.level = data.level;
    this.pop = data.population;
    this.visibleAOIs = new Set();

    this.fort = null;
    this.buildings = [];
    this.players = [];

    // TODO: make modifiable
    this.dispatch = { // 0 = fort, 1 = trade post, 3 = workshop
        1: [ // food
            [0,0,1] // 100% food to fort
        ],
        2: [ // bow
            [1,0,1]
        ],
        3: [ // timber
            [0,0,8], // 80% timber to fort ...
            [1,0,1],
            [3,0,1]
        ],
        9: [ // pelts
           [3,0,4],
           [1,0,1]
        ],
        10: [ // tunic
            [1,0,1]
        ],
        12: [ // gun
            [1,0,1]
        ],
        13: [ // shield
            [1,0,1]
        ],
        19: [ // quiver
            [1,0,1]
        ],
        22:[ // coal
            [1,0,1],
            [3,0,9]
        ],
        24:[ // iron
            [1,0,1],
            [3,0,9]
        ],
        25:[ // gold
            [3,0,1]
        ],
        28: [ // stone hatchet
            [1,0,1]
        ],
        34:[ // sulfur
            [1,0,1],
            [3,0,9]
        ]
    };

    GameServer.settlements[this.id] = this;
}

Settlement.prototype.dispatchResource = function(building,item,nb,force){
    if(!this.dispatch.hasOwnProperty(item)){
        //console.warn('No dispatch rule for item',item);
        if(force) {
            this.addToFort(item,nb);
            building.takeItem(item,nb);
        }
        return;
    }
    //console.log('-----Dispatching ',nb,' ',item,'------');
    var failures = 0;
    while(nb > 0) {
        if(failures >= this.dispatch[item].length) break;
        for (var i = 0; i < this.dispatch[item].length; i++) {
            var d = this.dispatch[item][i];
            var type = d[0];
            var current = d[1];
            var max = d[2];
            if (current < max) {
                var amount = Math.min(max - current, nb);
                var success = this.addResourceToBuilding(type, item, amount);
                if(success){
                    this.dispatch[item][i][1] += amount;
                    building.takeItem(item,amount);
                    nb -= amount;
                }else{
                    failures++;
                }
                if (nb == 0) break;
            }
        }
        if(nb > 0){
            for (var i = 0; i < this.dispatch[item].length; i++) {
                this.dispatch[item][i][1] = 0;
            }
        }
    }
};

Settlement.prototype.addResourceToBuilding = function(type,item,nb){
    var building = this.buildings.find(function(b){
        return b.type == type;
    });
    if(!building){
        console.warn('No building found of type',type);
        return false;
    }
    if(building.isDestroyed()) return false;
    building.giveItem(item,nb);
    console.log('Dispatching',nb,' ',GameServer.itemsData[item].name,' to building',GameServer.buildingsData[type].name);
    return true;
};

Settlement.prototype.setModel = function(model) {
    this.model = model;
};

Settlement.prototype.registerPlayer = function(player){
    this.players.push(player.id);
    player.applyFoodModifier(this.surplus);
    GameServer.checkForTracking(player);
};

Settlement.prototype.removePlayer = function(player){
    var idx= this.players.indexOf(player.id);
    if(idx > -1) this.players.splice(idx,1);
};

Settlement.prototype.registerBuilding = function(building){
    this.buildings.push(building);
    if(this.fort) this.fort.addBuilding(building);
    this.refreshListing();
};

Settlement.prototype.removeBuilding = function(building){
    for(var i = 0; i < this.buildings.length; i++){
        if(this.buildings[i].id == building.id) this.buildings.splice(i,1);
    }
    if(this.fort.id == building.id) this.fort = null;
};

Settlement.prototype.getBuildings = function(){
    return this.buildings.map(function(b){
        return b.listingTrim();
    });
};

Settlement.prototype.getBuildingMarkers = function(){
    return this.buildings.map(function(b){
        var entrance = GameServer.buildingsData[b.type].entrance;
        var xoffset = (entrance ? entrance.x + 2 : Math.round(b.width/2));
        return {
            marker:'building',
            x: b.x + xoffset,
            y:b.y,
            type:b.type
        };
    });
};

Settlement.prototype.registerFort = function(fort){
    this.fort = fort;
    // TODO: update fort when these values change
    this.fort.setProperty('population',this.pop);
    this.fort.setProperty('devlevel',this.level);
    this.fort.setProperty('danger',this.danger);
    this.respawnLocation = {
        x: this.fort.x + GameServer.buildingsData[0].entrance.x,
        y: this.fort.y + GameServer.buildingsData[0].entrance.y + 2
    };

    Utils.listAdjacentAOIs(this.fort.aoi).forEach(function(aoi){
        this.visibleAOIs.add(aoi);
    },this);
    console.log('Visble AOIs:',this.visibleAOIs);
    this.fort.setProperty('visibleAOIs',this.visibleAOIs);
};

Settlement.prototype.getAOI = function(){
    return this.fort.getAOI();
};

Settlement.prototype.getFortGold = function(){
    return this.fort.getGold();
};

Settlement.prototype.takeFortGold = function(nb){
    this.fort.takeGold(nb);
};

Settlement.prototype.addToFort = function(item,nb){
    this.fort.giveItem(item,nb);
};
Settlement.prototype.takeFromFort = function(item,nb){
    this.fort.takeItem(item,nb);
};

Settlement.prototype.refreshListing = function(){
    if(!this.fort) return;
    this.fort.refreshListing();
};

Settlement.prototype.consumeFood = function(){
    if(!GameServer.isTimeToUpdate('foodConsumption')) return false;
    var consumption = Formulas.foodConsumption(this.pop);
    console.log(this.name, 'consuming', consumption, 'food');
    if (consumption) this.takeFromFort(GameServer.miscParameters.foodID, consumption);
    // No need to save, surplus will be recomputed upon loading settlement
    return (consumption > 0);
};

// Called whenever food amount changes and directly after all buildings are read
Settlement.prototype.computeFoodSurplus = function(){
    if(!this.fort) return;
    console.log('Computing food surplus...');
    var foodAmount = this.fort.getItemNb(GameServer.miscParameters.foodID);
    if(this.pop === undefined){
        console.warn('Undefined population for settlement',this.name);
        this.pop = 0;
    }
    var required = Formulas.computeRequiredFood(this.pop);
    var delta = foodAmount - required;
    console.log('delta = ',delta,'required=',required);
    this.surplus = Formulas.decimalToPct(delta/required);
    if(isNaN(this.surplus)){
        console.warn('NaN surplus for settlement',this.name);
        this.surplus = 0;
    }
    console.log('Surplus for ',this.name,':',this.surplus,'%');
    this.buildings.forEach(function(building){
        building.setProperty('foodsurplus',this.surplus);
    },this);
};

Settlement.prototype.computeFoodModifier = function(){
    // Not converted to % since not broadcast
    return Formulas.computeSettlementFoodModifier(Formulas.pctToDecimal(this.surplus));
};

Settlement.prototype.update = function(){
    if(!this.fort) return;

    var consumed = this.consumeFood();

    if(consumed) {
        this.computeFoodSurplus();

        this.players.forEach(function (p) {
            GameServer.players[p].applyFoodModifier(this.surplus);
        }, this);

        this.buildings.forEach(function (building) {
            building.computeProductivity();
        });
        this.refreshListing();
    }
    this.spontaneousHarvesting();
};

Settlement.prototype.spontaneousHarvesting = function(){
    // TODO: conf
    if(!GameServer.isTimeToUpdate('harvesting')) return false;
    this.addResourceToBuilding(3,7,Utils.randomInt(1,2)); // wood
    this.addResourceToBuilding(3,26,Utils.randomInt(1,2)); // stone
    this.addResourceToBuilding(3,27,Utils.randomInt(1,2)); // bone
};

Settlement.prototype.save = function(){
    if(!this.model) return;
    var _settlement = this;
    GameServer.SettlementModel.findById(this.model._id, function (err, doc) {
        if (err) throw err;

        doc.set(_settlement);
        doc.save(function (err) {
            if (err) throw err;
        });
    });
};

Settlement.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','name','pop','surplus'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.buildings = this.buildings.map(function(building){
        return building.trim();
    });
    return trimmed;
};

// Trimming for the purpose of settlement selection
Settlement.prototype.selectionTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','name','pop','surplus','desc','level'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = (this.fort.x-30)/World.worldWidth; // quick fix
    trimmed.y = (this.fort.y-10)/World.worldHeight;
    trimmed.buildings = this.buildings.length;
    return trimmed;
};

// Trimming for the purpose of fort map display
Settlement.prototype.mapTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['name'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = (this.fort ? this.fort.x : 0);
    trimmed.y = (this.fort ? this.fort.y : 0);
    return trimmed;
};

module.exports.Settlement = Settlement;