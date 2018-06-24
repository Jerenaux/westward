/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var Civ = new Phaser.Class({

    Extends: Moving,

    initialize: function Civ() {
        Moving.call(this,0,0);
        this.entityType = 'civ';
        //this.orientationPin = new OrientationPin('animal');
    },

    setUp: function(data){
        //var animalData = Engine.animalsData[data.type];
        this.id = data.id;

        Engine.civs[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.setPosition(data.x,data.y);
        this.setTexture('enemy');
        this.restingFrames = {
            up: 104,
            down: 130,
            left: 117,
            right: 143
        };
        this.setFrame(this.restingFrames.down,false,false);
        this.setOrigin(0.2,0.5);

        var shape = new Phaser.Geom.Polygon([20,15,50,15,50, 60, 20, 60]);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

        this.setVisible(true);
        this.dead = false;
        this.name = 'מִ  ת  נַ  גֵ  ד';

        this.animPrefix = 'enemy';
        this.footprintsFrame = 0;
        this.printsVertOffset = 10;

        //this.manageOrientationPin();
    },

    update: function(data){
        if(data.path) this.queuePath(data.path);
        if(data.stop) this.serverStop(data.stop.x,data.stop.y); // TODO: move to new Moving update() supermethod
        if(data.melee_atk) {
            this.computeOrientation(this.tileX,this.tileY,data.melee_atk.x,data.melee_atk.y);
            this.faceOrientation();
            this.play(this.animPrefix+'_attack_'+this.orientation);
        }
        Engine.handleBattleUpdates(this,data);
        if(data.dead) this.die();
    },

    remove: function(){
        //console.log('remove ',this.id,'(',this.tileX,',',this.tileY,',',this.chunk,',)');
        CustomSprite.prototype.remove.call(this);
        //this.orientationPin.hide();
        //this.orientationPin.reset();
        delete Engine.civs[this.id];
    },

    die: function(){
        this.play(this.animPrefix+'_death');
        this.dead = true;
    },

    // ### INPUT ###

    handleClick: function(){
        if(BattleManager.inBattle){
            if(Engine.dead) return;
            BattleManager.processNPCClick(this);
        }else{
            Engine.processNPCClick(this);
        }
    },

    handleOver: function(){
        if(!BattleManager.inBattle && Engine.inMenu) return;
        if(BattleManager.inBattle) {
            var dx = Math.abs(this.tileX-Engine.player.tileX);
            var dy = Math.abs(this.tileY-Engine.player.tileY);
            var cursor = (this.dead ? UI.cursor : (dx+dy == 1 || (dx == 1 && dy == 1) ? UI.swordCursor : UI.bowCursor));
            UI.setCursor(cursor);
        }else{
            var cursor = (this.dead ? UI.handCursor : UI.swordCursor);
            UI.setCursor(cursor);
        }
        UI.tooltip.updateInfo((this.dead ? 'Dead ' : '')+this.name);
        UI.tooltip.display();
    },

    handleOut: function(){
        UI.setCursor();
        UI.tooltip.hide();
    }
});