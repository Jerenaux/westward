/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 27-05-18.
 */

function MiniMap(){
    var r = 150;

    var x = Engine.getGameConfig().width - r/2 - 20;
    var y = r/2 + 20;

    this.bg = UI.scene.add.sprite(x,y,'minimap');
    this.bg.setDepth(1);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = new Map(x,y,r,r,0,0,'player',false);
    this.map.addMask(null,{
        type: 'circle',
        x: x,
        y: y,
        w: 0.95*r
    });

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
    this.map.display();
};

MiniMap.prototype.hide = function(){
    if(this.bg) this.bg.setVisible(false);
    this.map.hide();
};
