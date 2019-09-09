function Region(data){
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;

    this.status = 0;
    this.buildings = [];
}

Region.prototype.addBuilding = function(building){
    this.buildings.push(building);
};

export default Region