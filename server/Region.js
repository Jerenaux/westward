var clone = require('clone');

import GameServer from "./GameServer";
import Inventory from "../shared/Inventory";
import Utils from '../shared/Utils'
    
function Region(data){
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    this.sea = data.sea;
    this.starting = data.starting;

    // 0: wild, 1: occupied, 2: settled
    this.status = undefined;
    this.buildings = [];
    this.players = new Set();
    this.exploredAreas = new Set();
    this.itemCounts = new Inventory();
    this.food = [0,0];
    this.resources = []; // list of coordinates where static resources are
    this.sz = []; // list of SpawnZones
    this.aois = [];
    this.civCasualties = [0,0];
    this.craft = new Inventory();
    this.gather = new Inventory();
    this.counts = {};
    this.missionTypes = {};
}

Region.prototype.addPlayer = function(id){
    this.players.add(id);
    // this.updateFood();
};

Region.prototype.removePlayer = function(id){
    this.players.delete(id);
    // this.updateFood();
};

Region.prototype.addItem = function(item,nb){
    this.itemCounts.add(item,nb);
    if(item == 1) this.food[0] += nb;
};

Region.prototype.removeItem = function(item,nb){
    this.itemCounts.take(item,nb);
    if(item == 1) this.food[0] -= nb;
};


Region.prototype.addResource = function(loc){
    this.resources.push(loc);
};

Region.prototype.addSZ = function(sz){
    this.sz.push(sz);
};

Region.prototype.addAOI = function(aoi){
    this.aois.push(aoi);
    // console.warn('aoi',aoi,'added to region',this.name);
};

Region.prototype.updateStatus = function(){
    // console.log('['+this.name+'] Status update');
    var status_ = this.status;
    this.status = 0;
    if(this.civBuildings > 0) this.status = 1; //occupied
    if(this.playerBuildings > 10 && this.civBuildings == 0) this.status = 2; //settled //TODO; conf
    if(this.status != status_){
        this.setGoals();
        GameServer.setFlag('regionsStatus');
    }
};

Region.prototype.setGoals = function(){
    this.counts = {};
    this.missionTypes = {};
    this.XPtable = {};
    this.missionLabels = {};
    GameServer.missionsData.missions.forEach(this.addMission, this);
    this.craft.toList().forEach(function(item){
        this.addMission(Utils.getItemMissionData('craftitem:'+item[0],10));
    },this);
    this.gather.toList().forEach(function(item){
        this.addMission(Utils.getItemMissionData('getitem:'+item[0],10));
    },this);
    for(var type in this.missionTypes){
        this.missionTypes[type] = Array.from(this.missionTypes[type]);
    }
};

Region.prototype.addMission = function(mission){
    if(!mission.regionStatus.includes(this.status)) return;
    if(mission.skipSea && this.sea) return;
    if(!(mission.count in this.counts)) this.counts[mission.count] = [0,0];
    this.counts[mission.count][1] += mission.variableGoal ? this.computeMissionGoal(mission.count) : mission.goal;

    if(!(mission.type in this.missionTypes)) this.missionTypes[mission.type] = new Set();
    this.missionTypes[mission.type].add(mission.count);

    if(!(mission.count in this.XPtable)) this.XPtable[mission.count] = {
        0: 0,
        1: 0,
        2: 0,
        3: 0
    };
    this.missionLabels[mission.count] = mission.type;
    for(var clas in mission.rewards){
        this.XPtable[mission.count][clas] += mission.rewards[clas];
    }
};

Region.prototype.updateCounts = function(){
    // console.log('['+this.name+'] Counts update');
    this.updateCount('allbuildings',this.playerBuildings);
    this.updateCount('exploration',this.explored);
    this.updateCount('bldfood',this.food[1]);
    this.updateCount('civhutkilled',this.civCasualties[1]);
    this.updateCount('civhuts',this.seenCivBuildings);
    this.updateCount('civkilled',this.civCasualties[0]);
    this.updateCount('playerfood',this.food[0]);
    this.updateCount('resources',this.visibleNodes);
    for(var type in this.buildingsTypes){
        this.updateCount('building:'+type,this.buildingsTypes[type]);
    }
    this.craft.toList().forEach(function(item){
        this.updateCount('craftitem:'+item[0],this.itemCounts.getNb(item[0]));
    },this);
    this.gather.toList().forEach(function(item){
        this.updateCount('getitem:'+item[0],this.itemCounts.getNb(item[0]));
    },this);
    GameServer.setFlag('regionsStatus'); // TODO: eventually, don't broadcast all regions but only changed ones
    // console.log('['+this.name+'] Status: ',this.status,' :: ',this.counts);
};

Region.prototype.updateCount = function(count,value){
    if(count in this.counts) {
        this.counts[count][0] = value;
        return this.counts[count][0] < this.counts[count][1];
    }
    return false;
};

Region.prototype.computeMissionGoal = function(goal){
    // TODO: conf/JSON
    switch(goal){
        case 'resources':
            return Math.ceil(this.nbNodes/3); // A third of available nodes
        case 'exploration':
            return Math.ceil(this.nbAreas/2); // half the AOIs
        case 'civhutkilled':
            return Math.ceil(this.civBuildings/2); // half the enemy blds
        case 'civhuts':
            return Math.ceil(this.civBuildings/2); // half the enemy blds
    }
};

Region.prototype.update = function(){
    // console.log('['+this.name+'] General update');
    this.updateBuildings();
    var status_ = this.status;
    this.updateStatus();
    this.updateResources();
    this.updateFoW();
    this.updateItemMissions();
    if(this.status != status_) this.setGoals();
    this.updateCounts();
};

Region.prototype.event = function(event, player, extra){
    console.log('['+this.name+'] event ',event);
    var counts_ = clone(this.counts);
    switch(event){
        case 'build':
            this.updateBuildings();
            this.updateFoW();
            this.updateResources();
            break;
        case 'consumefood':
            this.updateBuildings();
            // this.updateFood();
            break;
        case 'destroycivhut':
            this.countDestroyedCivBld();
            this.updateBuildings();
            break;
        case 'fow':
            this.updateBuildings();
            this.updateFoW();
            this.updateResources();
            break;
        case 'givefood': // TODO: change if addition of storage missions for other items
            this.updateBuildings();
            this.food[0] -= extra.nb;
            // this.updateFood();
            break;
        case 'killedciv':
            this.countKilledCiv();
            break;
        // do nothing (because counts are updated by GameServer.createItem()) but trigger updateCounts below
        // case 'loot':
        //     // this.updateFood();
        //     break;
        // case 'pickup':
        //     break;
    }
    this.updateCounts();
    if(player){
        for(var count in this.counts){
            var p = counts_[count];
            var c = this.counts[count];
            if(p[0] < p[1] && c[0] > p[0]){
                // console.log(count,p,c);
                player.addNotif('You contributed to a region mission ('+this.missionLabels[count]+')!');
                var xp = this.XPtable[count];
                for(var clas in xp){
                    if(xp[clas] > 0) player.gainClassXP(clas, xp[clas], true);
                }
            }
        }
    }
    this.updateStatus();
};


Region.prototype.updateItemMissions = function(){
    // console.log('['+this.name+'] Items missions update');
    this.craft = new Inventory();
    this.gather = new Inventory();
    if(this.status != 2) return;
    var goals = [2, 6, 46, 19, 28, 29, 45];
    goals.forEach(this.computeItemMissions,this);
};

Region.prototype.hasItem = function(item,nb){
    return this.itemCounts.getNb(item) >= nb;
};

Region.prototype.computeItemMissions = function(item){
    // console.warn('Item mission goal for ',GameServer.itemsData[item].name);
    var nb = 10; //TODO vary + conf
    if(this.hasItem(item,nb)) return;
    var recipe = GameServer.itemsData[item].recipe;
    if(recipe) {
        var canCraft = true;
        for (var itm in recipe) {
            if (!this.hasItem(itm, recipe[itm] * nb)) {
                this.computeItemMissions(itm);
                canCraft = false;
            }
        }
        if (canCraft) this.craft.add(item, nb);
    }else{
        this.gather.add(item,nb);
    }
};

Region.prototype.addBuilding = function(building){
    this.buildings.push(building);
};

Region.prototype.countDestroyedCivBld = function(){
    this.civCasualties[1]++;
};

Region.prototype.countKilledCiv = function(){
    this.civCasualties[0]++;
};

Region.prototype.updateBuildings = function(){
    // console.log('['+this.name+'] Buildings update');
    var playerBuildings = 0;
    var civBuildings = 0;
    var seenCivBuildings = 0;
    this.buildingsTypes = {};
    this.food[1] = 0;
    this.buildings.forEach(function(bld){
        if(!bld.isBuilt()) return;
        if(bld.civ){
            civBuildings++;
            if(GameServer.isNotInFoW(bld.x,bld.y)) seenCivBuildings++;
        }else{
            playerBuildings++;
            if(!(bld.type in this.buildingsTypes)) this.buildingsTypes[bld.type] = 0;
            this.buildingsTypes[bld.type]++;
            this.food[1] += bld.getItemNb(1);
        }
    },this);
    
    this.civBuildings = civBuildings;
    this.seenCivBuildings = seenCivBuildings;
    this.playerBuildings = playerBuildings;
};

Region.prototype.updateResources = function(){
    // console.log('['+this.name+'] Resources update');
    this.nbNodes = this.sz.length + this.resources.length;
    this.visibleNodes = 0;
    // console.warn('fowlist:',GameServer.fowList);
    this.resources.forEach(function(loc){
        if(GameServer.isNotInFoW(loc.x, loc.y)) this.visibleNodes++;
    },this);
    this.sz.forEach(function(sz){
        if(GameServer.isNotInFoW(sz.x, sz.y)) this.visibleNodes++;
    },this);
};

Region.prototype.updateFoW = function(){
    // console.log('['+this.name+'] FoW update');
    this.nbAreas = this.aois.length;
    this.explored = 0;
    var exploredAreas = new Set();
    this.aois.forEach(function(aoi){
        if(GameServer.fowList.includes(aoi)){
            exploredAreas.add(aoi);
            this.explored++;
        }
    }, this);
    var diff = Array.from(exploredAreas).filter(function(x) { return !this.exploredAreas.has(x)}.bind(this));
    // console.warn(this.exploredAreas);
    // console.warn(exploredAreas);
    // console.warn('diff:',diff);
    this.exploredAreas = exploredAreas;
};

Region.prototype.trim = function(){
    return {
        id: this.id,
        status: this.status,
        counts: this.counts,
        missionTypes: this.missionTypes,
        items: this.itemCounts.toList()
    }
};

export default Region