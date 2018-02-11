/**
 * Created by Jerome on 12-01-18.
 */
var Map = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Map(x, y) {
        CustomSprite.call(this, x, y, 'fullmap');

        this.setDepth(Engine.UIDepth+2);
        this.setScrollFactor(0);
        this.setVisible(false);

        var mask = Engine.scene.add.sprite(x,y,'radial3');
        mask.setScale(1.1);
        mask.setDepth(Engine.UIDepth+2);
        mask.setScrollFactor(0);
        mask.setVisible(false);
        this.mask = new Phaser.Display.Masks.BitmapMask(Engine.scene,mask);
        this.maskPicture = mask;

        this.text = Engine.scene.add.text(0, 0, 'New Beginning',{font: '60px treamd', fill: '#966f33', stroke: '#000000', strokeThickness: 3});
        this.text.setDepth(Engine.UIDepth+3);
        this.text.setVisible(false);
        this.text.setScrollFactor(0,0);
        this.text.setAlpha(0.5);
        this.text.setOrigin(0.5);
        this.text.mask = new Phaser.Display.Masks.BitmapMask(Engine.scene,mask);

        this.setInteractive(new Phaser.Geom.Rectangle(0,0,this.width,this.height),Phaser.Geom.Rectangle.Contains);
        Engine.scene.input.setDraggable(this);

        this.pins = [];
        this.resetCounter();
        this.clickedTile = null;
    },

    handleDrag: function(x,y){
        if(Math.abs(x-this.initialX) > 500) return;
        if(Math.abs(y-this.initialY) > 500) return;
        var dx = this.x - x;
        var dy = this.y - y;
        this.x = x;
        this.y = y;
        this.input.hitArea.x += dx;
        this.input.hitArea.y += dy;
        this.text.x -= dx;
        this.text.y -= dy;
        this.movePins(dx,dy);
    },

    movePins: function(dx,dy){
        this.pins.forEach(function(p){
            p.x -= dx;
            p.y -= dy;
        });
    },

    handleClick: function(pointer){
        if(pointer.downX != pointer.upX || pointer.downY != pointer.upY) return; // drag
        //this.addRedPin(pointer.x,pointer.y);
        console.log(Utils.screenToMap(pointer.x,pointer.y,this));
    },

    getNextPin: function(){
        if(this.pinsCounter >= this.pins.length){
            this.pins.push(new Pin(this.maskPicture));
        }
        return this.pins[this.pinsCounter++];
    },

    addPin: function(x,y,name,texture){
        var pct = Utils.tileToPct(x,y);
        var dx = (pct.x - this.originX)*this.width;
        var dy = (pct.y - this.originY)*this.height;
        var pin = this.getNextPin();
        pin.setUp(this.x+dx,this.y+dy,name,texture);
        return pin;
    },

    resetCounter: function(){
        this.pinsCounter = 0;
    },

    display: function(x,y){
        var origin = Utils.tileToPct(Engine.currentBuiling.tileX,Engine.currentBuiling.tileY);
        this.setOrigin(origin.x,origin.y);
        this.setPosition(x,y);
        this.initialX = this.x;
        this.initialY = this.y;

        this.text.setPosition(x,y);
        this.text.setVisible(true);

        var dragw = 400;
        var dragh = 400;
        var rectx = (this.width*origin.x)-(dragw/2);
        var recty = (this.height*origin.y)-(dragh/2);
        this.input.hitArea = new Phaser.Geom.Rectangle(rectx,recty,dragw,dragh);

        this.setVisible(true);
    },

    hide: function(){
        this.hidePins();
        this.text.setVisible(false);
    },

    hidePins: function(){
        this.resetCounter();
        this.pins.forEach(function(p){
            p.setVisible(false);
        });
    }
});

var Pin = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Pin (mask) {
        CustomSprite.call(this, 0, 0, 'pin');
        this.setDepth(Engine.UIDepth+3);
        this.setScrollFactor(0);
        this.setOrigin(0.5,1);
        this.setVisible(false);
        this.setInteractive();
        this.mask = new Phaser.Display.Masks.BitmapMask(Engine.scene,mask);
    },

    setUp: function(x,y,name,texture){
        if(texture) this.setTexture(texture);
        this.setPosition(x,y);
        this.name = name;
        this.setVisible(true);
    },

    highlight: function(){
        this.setTexture('redpin');
    },

    unhighlight: function(){
        this.setTexture('pin');
    },

    handleOver: function(){
        if(Math.abs(this.x - this.mask.bitmapMask.x) > this.mask.bitmapMask.width/2) return;
        if(Math.abs(this.y - this.mask.bitmapMask.y) > this.mask.bitmapMask.height/2) return;
        Engine.tooltip.updateInfo(this.name);
        Engine.tooltip.display();
    },

    handleOut: function(){
        Engine.tooltip.hide();
    },

    hide: function(){
        this.setVisible(false);
    }
});