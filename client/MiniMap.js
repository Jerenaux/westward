/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 27-05-18.
 */

function MiniMap(margin){
    var r = 150;
    margin = margin || 20;

    var x = Engine.getGameConfig().width - r/2 - margin;
    var y = r/2 + margin;

    this.bg = UI.scene.add.sprite(x,y,'minimap');
    this.bg.setDepth(1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.ring = UI.scene.add.sprite(x,y,'mapring');
    this.ring.setDepth(1);
    this.ring.setScrollFactor(0);
    this.ring.setVisible(false);

    this.map = new Map(x,y,r,r,0,0,'player',false);
    this.map.minimap = true;
    this.map.addMask(null,{
        type: 'circle',
        x: x,
        y: y,
        w: 133
    });
    //this.map.addMask('minimap');

    this.bg.setInteractive();
    this.bg.on('pointerover',function(){
        UI.manageCursor(1,'UI');
    });
    this.bg.on('pointerout',function(){
        UI.manageCursor(0,'UI');
    });
}

MiniMap.prototype.follow = function(){
    this.map.follow();
};

MiniMap.prototype.display = function(){
    if(this.bg) this.bg.setVisible(true);
    this.ring.setVisible(true);
    this.map.display();
};

MiniMap.prototype.hide = function(){
    if(this.bg) this.bg.setVisible(false);
    this.ring.setVisible(false);
    this.map.hide();
};
