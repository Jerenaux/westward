/**
 * Created by Jerome on 07-10-17.
 */

var Building = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Building (x, y, type, id) {
        var data = Engine.buildingsData[type];
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, data.sprite);

        this.tileX = x;
        this.tileY = y;
        this.depth = Engine.buildingsDepth + y;
        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});

        this.panel = new Panel(0,376,300,200,data.name);
        this.panel.addRing(260,-10,'red','close');

        var shape = new Phaser.Geom.Polygon(data.shape);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
        //this.setDisplayOrigin(0);  //disabled so that the y coordinate is usable for depth sorting

        var realx = Math.floor((this.tileX*Engine.tileWidth - data.width/2)/Engine.tileWidth);
        var realy = Math.floor((this.tileY*Engine.tileHeight - data.height/2)/Engine.tileHeight);
        PFUtils.collisionsFromShape(shape.points,realx,realy,data.width,data.height,Engine.collisions);
    },

    handleClick: function(){
        if(this.panel.displayed){
            this.panel.hide();
            Engine.inBuildingPanel = false;
            Engine.currentBuildingPanel = null;
        }else {
            this.panel.display();
            Engine.inBuildingPanel = true;
            Engine.currentBuildingPanel = this.panel;
        }
    }
});