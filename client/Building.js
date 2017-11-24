/**
 * Created by Jerome on 07-10-17.
 */

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (x, y, type, settlement, id) {
        var data = Engine.buildingsData[type];
        var settlementData = Engine.settlementsData[settlement];
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, data.sprite);

        this.tileX = x;
        this.tileY = y;
        this.depth = Engine.buildingsDepth + (this.tileY+((data.height/2)/32))/1000;
        this.id = id;
        this.settlement = settlement;
        this.inventory = new Inventory(100);
        this.chunk = Utils.tileToAOI({x:x,y:y});

        var height = 200;
        var width = 300;
        var py = Engine.baseViewHeight*Engine.tileHeight - height;
        var panelName = data.name+' of '+settlementData.name;
        this.panel = new Panel(0,py,width,height,panelName);
        this.panel.addRing(260,-10,'red','close',Engine.closePanel.bind(this.panel));
        this.panel.addInventory(null,5,5,this.inventory,true);
        this.handleClick = Engine.togglePanel.bind(this);

        var shape = new Phaser.Geom.Polygon(data.shape);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

        var center = false;
        var spriteX, spriteY;
        if(center){
            spriteX = Math.floor((this.tileX*Engine.tileWidth - data.width/2)/Engine.tileWidth);
            spriteY = Math.floor((this.tileY*Engine.tileHeight - data.height/2)/Engine.tileHeight);
        }else{
            this.setDisplayOrigin(0);  //disabled so that the y coordinate is usable for depth sorting
            spriteX = this.tileX;
            spriteY = this.tileY;
        }
        PFUtils.collisionsFromShape(shape.points,spriteX,spriteY,data.width,data.height,Engine.collisions);
    }
});