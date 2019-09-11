function Region(data){
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;

    // 0: wild, 1: occupied, 2: contested, 3: settled
    this.status = 0;
    this.buildings = [];

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

Region.prototype.update = function(){
    var playerBuildings = 0;
    var civBuildings = 0;
    this.buildings.forEach(function(bld){
        if(!bld.isBuilt()) return;
        if(bld.civ){
            civBuildings++;
        }else{
            playerBuildings++;
            if(bld.type in this.goals.buildings) this.goals.buildings[bld.type][0]++
        }
    },this);
    if(playerBuildings == 0 && civBuildings == 0) this.status = 0; //wild
    if(playerBuildings > 0 && civBuildings == 0) this.status = 3; //settled
    if(playerBuildings == 0 && civBuildings > 0) this.status = 1; //occupied
    if(playerBuildings > 0 && civBuildings > 0) this.status = 2; //contested
    console.warn('['+this.name+'] Status: ',this.status);
    // console.warn(this.goals);
};

export default Region