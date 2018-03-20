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
    this.bg = UI.scene.add.sprite(mapx,mapy,'scrollbgh');
    this.bg.setDepth(1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(mapx,mapy);
    this.pins = [];

    this.content.push(this.bg);
    this.content.push(this.map);
};

MapPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);
    this.map.display(this.bg.x,this.bg.y);
    this.displayPins();
};

MapPanel.prototype.update = function(){
    this.hidePins();
    this.displayPins();
};

MapPanel.prototype.displayPins = function(){
    var list = Engine.currentBuiling.danger;
    for(var i = 0; i < list.length; i++){
        this.pins.push(this.map.addPin(list[i][0],list[i][1],'Danger','skull'));
    }
};

MapPanel.prototype.hidePins = function(){
    this.pins.forEach(function(p){
        p.hide();
    });
    this.pins = [];
};

MapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

MapPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.map.hide();
};