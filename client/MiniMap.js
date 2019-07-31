/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 27-05-18.
 */

function MiniMap(){
    var r = 65;
    var margin = 45;

    var x = Engine.getGameConfig().width - r/2 - margin;
    var y = r/2 + margin;

    this.ring = UI.scene.add.sprite(x,y,'UI','mapring');
    this.ring.setDepth(3);
    this.ring.setScrollFactor(0);
    this.ring.setVisible(false);

    this.map = new Map(x,y,r,r,0,0,false,true);
    this.map.addMask(null,{
        type: 'circle',
        x: x,
        y: y,
        w: 133
    });

    var w = 150;
    // var rect = UI.scene.add.rectangle(1024-w,0,w,w,0xffffff);
    var rect = UI.scene.add.image(1024-w,0,'UI','invisible');
    rect.setInteractive();
    rect.setScrollFactor(0);
    rect.setOrigin(0);
    this.displayed = false;
}

MiniMap.prototype.follow = function(){
    this.map.follow();
};

MiniMap.prototype.display = function(){
    //if(this.bg) this.bg.setVisible(true);
    this.ring.setVisible(true);
    this.map.display();
    this.displayed = true;
};

MiniMap.prototype.hide = function(){
    //if(this.bg) this.bg.setVisible(false);
    this.ring.setVisible(false);
    this.map.hide();
    this.displayed = false;
};
