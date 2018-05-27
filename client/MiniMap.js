/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 27-05-18.
 */

function MiniMap(){
    var x = Engine.getGameConfig().width -120;
    var y = 120;

    this.bg = UI.scene.add.sprite(x,y,'minimap');
    this.bg.setDepth(1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(x,y,200,200,0,0,'player',false);
    this.map.addMask(null,{
        type: 'circle',
        x: x,
        y: y,
        w: 190,
        h: 190
    });
}

MiniMap.prototype.focus = function(){
    var mapLoc = this.map.computeMapLocation(Engine.player.tileX, Engine.player.tileY);
    this.map.focus(mapLoc.x,mapLoc.y);
};

MiniMap.prototype.display = function(){
    if(this.bg) this.bg.setVisible(true);
    this.map.display();
};

MiniMap.prototype.hide = function(){
    if(this.bg) this.bg.setVisible(false);
    this.map.hide();
};
