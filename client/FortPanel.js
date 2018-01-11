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

    this.map = Engine.scene.add.sprite(scrollx,scrolly,'fullmap');
    this.map.setDepth(Engine.UIDepth+2);
    this.map.setScrollFactor(0);
    this.map.setVisible(false);

    var mask = Engine.scene.add.sprite(scrollx,scrolly,'radial3').setScale(1.1);
    mask.setDepth(Engine.UIDepth+2);
    //mask.setDisplayOrigin(0,0);
    mask.setScrollFactor(0);
    mask.setVisible(false);


    this.map.mask = new Phaser.Display.Masks.BitmapMask(Engine.scene,mask);
    this.map.setInteractive(new Phaser.Geom.Rectangle(0,0,this.map.width,this.map.height),Phaser.Geom.Rectangle.Contains);
    Engine.scene.input.setDraggable(this.map);
    var _map = this.map;
    this.map.handleDrag = function(x,y){
        //if(Math.abs(x-_map.initialX) > 500) return;
        //if(Math.abs(y-_map.initialY) > 500) return;
        console.log(x-_map.initialX);
        var dx = _map.x - x;
        var dy = _map.y - y;
        _map.x = x;
        _map.y = y;
        _map.input.hitArea.x += dx;
        _map.input.hitArea.y += dy;
    };
    this.map.handleClick = function(){console.log('click')};

    this.content.push(this.bg);
    this.content.push(this.map);
};


FortmapPanel.prototype.displayInterface = function(){
    this.bg.setVisible(true);

    var originX = Engine.currentBuiling.tileX/World.worldWidth;
    var originY = Engine.currentBuiling.tileY/World.worldHeight;
    this.map.setOrigin(originX,originY);
    this.map.setPosition(this.bg.x,this.bg.y);
    this.map.initialX = this.map.x;
    this.map.initialY = this.map.y;

    var dragw = 400;
    var dragh = 400;
    var rectx = (this.map.width*originX)-(dragw/2);
    var recty = (this.map.height*originY)-(dragh/2);
    var rect = new Phaser.Geom.Rectangle(rectx,recty,dragw,dragh);
    this.map.input.hitArea = rect;

    this.map.setVisible(true);
};

FortmapPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};