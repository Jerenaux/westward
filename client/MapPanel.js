/**
 * Created by jeren on 10-01-18.
 */

function MapPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.mapx = this.x + this.width/2; // Position of map sprite on screen
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

MapPanel.prototype.addMap = function(texture,w,h,dragX,dragY){
    this.map = new Map(this.mapx,this.mapy,w,h,dragX,dragY,true);
    this.map.panel = this;
    this.map.addMask(texture);
    this.content.push(this.map);
    return this.map;
};

MapPanel.prototype.displayInterface = function(){
    if(this.bg) this.bg.setVisible(true);
    this.map.display();
};

MapPanel.prototype.hideInterface = function(){
    if(this.bg) this.bg.setVisible(false);
    this.map.hide();
};

MapPanel.prototype.update = function(){
    //this.hidePins(); // todo: move to map
    //this.displayPins();
};

MapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

MapPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.map.hide();
};