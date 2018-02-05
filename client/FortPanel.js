/**
 * Created by jeren on 10-01-18.
 */

function FortPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.addInterface();
}

FortPanel.prototype = Object.create(Panel.prototype);
FortPanel.prototype.constructor = FortPanel;

FortPanel.prototype.addInterface = function(){
    //var scrollx = Engine.getGameConfig().width/2;
    //var scrolly = Engine.getGameConfig().height/2;
    var mapx = this.x + this.width/2;
    var mapy = this.y + this.height/2;
    this.bg = Engine.scene.add.sprite(mapx,mapy,'scrollbgh');
    this.bg.setDepth(Engine.UIDepth+1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(mapx,mapy);
    this.map.addPins(Object.keys(Engine.buildingsList).length+1); // +1 for new building pin

    this.content.push(this.bg);
    this.content.push(this.map);
};


FortPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);
    this.map.display(this.bg.x,this.bg.y);
};

FortPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

FortPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.map.hide();
};