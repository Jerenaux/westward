import GameServer from "./GameServer";
import Inventory from "../shared/Inventory";
    
function Region(data){
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;

    // 0: wild, 1: occupied, 2: settled
    this.status = undefined;
    this.buildings = [];
    this.players = new Set();
    this.itemCounts = new Inventory();
    this.food = [0,0];
    this.resources = []; // list of coordinates where static resources are
    this.sz = []; // list of SpawnZones
    this.aois = [];
    this.civCasualties = [0,0];

    this.counts = {}
}

Region.prototype.addPlayer = function(id){
    this.players.add(id);
    this.updateFood();
};

Region.prototype.removePlayer = function(id){
    this.players.delete(id);
    this.updateFood();
};

Region.prototype.addItem = function(item,nb){
    this.itemCounts.add(item,nb);
};

Region.prototype.removeItem = function(item,nb){
    this.itemCounts.take(item,nb);
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
    this.counts = {};
    var status_ = this.status;
    this.status = 0;
    if(this.civBuildings > 0) this.status = 1; //occupied
    if(this.playerBuildings > 10 && this.civBuildings == 0) this.status = 2; //settled //TODO; conf
    if(this.status == status_) return;

    GameServer.missionsData.missions.forEach(function(mission){
        if(!mission.regionStatus.includes(this.status)) return;
        if(!(mission.count in this.counts)) this.counts[mission.count] = [0,0];
        this.counts[mission.count][1] += mission.variableGoal ? this.computeMissionGoal(mission.count) : mission.goal;
    }, this);
    this.updateCounts();
};


Region.prototype.updateCounts = function(){
    this.updateCount('allbuildings',this.playerBuildings);
    this.updateCount('areas',this.explored);
    this.updateCount('bldfood',this.food[1]);
    this.updateCount('civhutkilled',this.civCasualties[1]);
    this.updateCount('civhuts',this.seenCivBuildings);
    this.updateCount('civkilled',this.civCasualties[0]);
    this.updateCount('playerfood',this.food[0]);
    this.updateCount('resources',this.visibleNodes);
    for(var type in this.buildingsTypes){
        this.updateCount('building:'+type,this.buildingsTypes[type]);
    }
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
    this.updateBuildings();
    this.updateStatus();
    this.updateResources();
    this.updateFoW();
    this.updateItemMissions();
    this.updateCounts();
    // console.warn('['+this.name+'] Status: ',this.status);
    // console.warn('['+this.name+'] AOIs: ',this.explored,'/',this.aois.length);
    // console.warn('['+this.name+'] nodes:', this.visible,'/',this.nbNodes);
    // console.warn('['+this.name+'] Civ buildings:', this.seenCivBuildings,'/',this.civBuildings);
    // console.warn('['+this.name+'] Player buildings:', this.playerBuildings);
    // console.warn('['+this.name+'] Iems:', this.itemCounts.toList());
    console.warn('['+this.name+'] Status: ',this.status,' :: ',this.counts);
};

Region.prototype.updateItemMissions = function(){
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
    GameServer.setFlag('regionsStatus');
};

Region.prototype.countKilledCiv = function(){
    this.civCasualties[0]++;
    GameServer.setFlag('regionsStatus');
};

Region.prototype.updateBuildings = function(){
    var playerBuildings = 0;
    var civBuildings = 0;
    var seenCivBuildings = 0;
    this.buildingsTypes = {};
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
    this.status = 0; //wild
    
    this.civBuildings = civBuildings;
    this.seenCivBuildings = seenCivBuildings;
    this.playerBuildings = playerBuildings;

    GameServer.setFlag('regionsStatus'); // TODO: Only in updateCounts? 
};


Region.prototype.updateFood = function(){
    var previous_ = this.food[0];
    this.food[0] = 0;
    for(var playerID of this.players){
        this.food[0] += GameServer.players[playerID].getItemNb(1);
    }
    if(this.food[0] != previous_) GameServer.setFlag('regionsStatus');
};

Region.prototype.updateResources = function(){
    this.nbNodes = this.sz.length + this.resources.length;
    this.visibleNodes = 0;
    this.resources.forEach(function(loc){
        if(GameServer.isNotInFoW(loc.x, loc.y)) this.visibleNodes++;
    },this);
    this.sz.forEach(function(sz){
        if(GameServer.isNotInFoW(sz.x, sz.y)) this.visibleNodes++;
    },this);
    GameServer.setFlag('regionsStatus');
};

Region.prototype.updateFoW = function(){
    this.nbAreas = this.aois.length;
    this.explored = 0;
    this.aois.forEach(function(aoi){
        if(GameServer.fowList.includes(aoi)) this.explored++;
    }, this);
};

Region.prototype.trim = function(){
    return {
        id: this.id,
        food: this.food,
        itemCounts: this.itemCounts.toList(),
        items: {
            craft: this.craft.toList(),
            gather: this.gather.toList()
        },
        buildings: this.buildingsTypes,
        totalbuildings: this.playerBuildings,
        status: this.status,
        resources: [this.visibleNodes, this.nbNodes],
        exploration: [this.explored, this.nbAreas],
        civs: [this.seenCivBuildings, this.civBuildings],
        civCasualties: this.civCasualties
    }
};

export default Region