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
    var scrollx = Engine.scene.game.config.width/2;
    var scrolly = Engine.scene.game.config.height/2;
    this.bg = Engine.scene.add.sprite(scrollx,scrolly,'scrollbgh');
    this.bg.setDepth(Engine.UIDepth+1);
    //this.bg.setDisplayOrigin(0,0);
    this.bg.setScrollFactor(0);
    this.bg.setVisible(false);

    this.map = Engine.scene.add.sprite(scrollx/2,scrolly/2-100,'fullmap');
    this.map.setDepth(Engine.UIDepth+2);
    this.map.setDisplayOrigin(0,0);
    this.map.setScrollFactor(0);
    this.map.setVisible(false);

    // 54, 46, 336, 324
    var mask = Engine.scene.add.sprite(scrollx,scrolly,'radial3').setScale(1.1);
    mask.setDepth(Engine.UIDepth+2);
    //mask.setDisplayOrigin(0,0);
    mask.setScrollFactor(0);
    mask.setVisible(false);

    this.map.mask = new Phaser.Display.Masks.BitmapMask(Engine.scene,mask);
    this.content.push(this.bg);
    this.content.push(this.map);
};


FortmapPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);
    this.map.setVisible(true);
};

FortmapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};