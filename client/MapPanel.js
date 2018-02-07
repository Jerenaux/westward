/**
 * Created by jeren on 10-01-18.
 */

function MapPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.addInterface();
}

MapPanel.prototype = Object.create(Panel.prototype);
MapPanel.prototype.constructor = MapPanel;

MapPanel.prototype.addInterface = function(){
    var mapx = this.x + this.width/2;
    var mapy = this.y + this.height/2;
    this.bg = Engine.scene.add.sprite(mapx,mapy,'scrollbgh');
    this.bg.setDepth(Engine.UIDepth+1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(mapx,mapy);
    //this.map.addPins(Object.keys(Engine.buildingsList).length+1); // +1 for new building pin
    //this.map.addPins(0);

    this.content.push(this.bg);
    this.content.push(this.map);
};

MapPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);
    this.map.display(this.bg.x,this.bg.y);
};

MapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

MapPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.map.hide();
};