import GameServer from "./GameServer";

function Region(data){
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;

    // 0: wild, 1: occupied, 2: contested, 3: settled
    this.status = 0;
    this.buildings = [];
    this.resources = []; // list of coordinates where static resources are
    this.sz = []; // list of SpawnZones
    this.aois = [];

    this.goals = {
        buildings: {
            11: [0,10],
            2: [0,4],
            3: [0,2],
            4: [0,2],
            6: [0,3]
        }
    }
}

Region.prototype.addBuilding = function(building){
    this.buildings.push(building);
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

Region.prototype.update = function(){
    this.updateBuildings();
    this.updateResources();
    this.updateFoW();
    console.warn('['+this.name+'] Status: ',this.status);
    console.warn('['+this.name+'] AOIs: ',this.explored,'/',this.aois.length);
    console.warn('['+this.name+'] nodes:', this.visible,'/',this.nbNodes);
    console.warn('['+this.name+'] Civ buildings:', this.seenCivBuildings,'/',this.civBuildings);
};

Region.prototype.updateBuildings = function(){
    var playerBuildings = 0;
    var civBuildings = 0;
    var seenCivBuildings = 0;
    this.buildings.forEach(function(bld){
        if(!bld.isBuilt()) return;
        if(bld.civ){
            civBuildings++;
            if(GameServer.isNotInFoW(bld)) seenCivBuildings++;
        }else{
            playerBuildings++;
            if(bld.type in this.goals.buildings) this.goals.buildings[bld.type][0]++;
        }
    },this);
    if(playerBuildings == 0 && civBuildings == 0) this.status = 0; //wild
    if(playerBuildings > 0 && civBuildings == 0) this.status = 3; //settled
    if(playerBuildings == 0 && civBuildings > 0) this.status = 1; //occupied
    if(playerBuildings > 0 && civBuildings > 0) this.status = 2; //contested
    this.civBuildings = civBuildings;
    this.seenCivBuildings = seenCivBuildings;

    GameServer.setFlag('regionsStatus');
};

Region.prototype.updateResources = function(){
    this.nbNodes = this.sz.length + this.resources.length;
    this.visible = 0;
    this.resources.forEach(function(loc){
        if(GameServer.isNotInFoW(loc.x, loc.y)) this.visible++;
    },this);
    this.sz.forEach(function(sz){
        if(GameServer.isNotInFoW(sz.x, sz.y)) this.visible++;
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
        status: this.status,
        nodes: [this.visible, this.nbNodes],
        exploration: [this.explored, this.nbAreas],
        civs: [this.seenCivBuildings, this.civBuildings]
    }
};

export default Region