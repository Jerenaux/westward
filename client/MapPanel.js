/**
 * Created by jeren on 10-01-18.
 */

function MapPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.mapx = this.x + this.width/2;
    this.mapy = this.y + this.height/2;
}

MapPanel.prototype = Object.create(Panel.prototype);
MapPanel.prototype.constructor = MapPanel;

MapPanel.prototype.addBackground = function(texture){
    this.bg = UI.scene.add.sprite(this.mapx,this.mapy,texture);
    this.bg.setDepth(1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);
    this.content.push(this.bg);
};

MapPanel.prototype.addMap = function(target,texture,w,h,dragX,dragY){
    this.map = new Map(this.mapx,this.mapy,w,h,target,dragX,dragY);
    this.map.addMask(texture);
    this.pins = []; // todo: move to map
    this.content.push(this.map);
};

MapPanel.prototype.displayInterface = function(){
    if(this.bg) this.bg.setVisible(true);
    this.map.display(this.mapx,this.mapy);
    this.displayPins(); // todo: move to map
};

MapPanel.prototype.update = function(){
    this.hidePins(); // todo: move to map
    this.displayPins();
};

// todo: move to map
MapPanel.prototype.displayPins = function(){
    /*var list = Engine.currentBuiling.danger;
    for(var i = 0; i < list.length; i++){
        this.pins.push(this.map.addPin(list[i][0],list[i][1],'Danger','skull'));
    }*/
};

// todo: move to map
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