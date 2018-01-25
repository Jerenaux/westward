/**
 * Created by jeren on 10-01-18.
 */

function FortmapPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

FortmapPanel.prototype = Object.create(Panel.prototype);
FortmapPanel.prototype.constructor = FortmapPanel;

FortmapPanel.prototype.addInterface = function(){
    var scrollx = Engine.getGameConfig().width/2;
    var scrolly = Engine.getGameConfig().height/2;
    this.bg = Engine.scene.add.sprite(scrollx,scrolly,'scrollbgh');
    this.bg.setDepth(Engine.UIDepth+1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(scrollx,scrolly);
    this.map.addPins(Object.keys(Engine.buildingsList).length+1); // +1 for new building pin

    this.content.push(this.bg);
    this.content.push(this.map);
};


FortmapPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);
    this.map.display(this.bg.x,this.bg.y);
};

FortmapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

FortmapPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.map.hide();
};