/**
 * Created by Jerome on 04-10-17.
 */
var Animal = new Phaser.Class({

    Extends: Moving,

    initialize: function Animal() {
        Moving.call(this,0,0);
        this.entityType = 'animal';
    },

    setUp: function(data){
        if(Engine.animals.hasOwnProperty(data.id)){
            console.warn('duplicate animal ',data.id,'at',data.x,data.y,'last seen at ',
                Engine.animals[data.id].tileX,',',Engine.animals[data.id].tileY);
        }

        var animalData = Engine.animalsData[data.type];
        this.id = data.id;

        Engine.animals[this.id] = this;
        //Engine.displayedAnimals.add(this.id);
        Engine.entityManager.addToDisplayList(this);

        this.setPosition(data.x,data.y);
        this.setTexture(animalData.sprite);
        this.setFrame(animalData.frame);
        this.setDisplayOrigin(0);
        this.dead = false;
        this.name = animalData.name+' '+this.id;
        this.walkAnimPrefix = animalData.walkPrefix;
        this.restingFrames = animalData.restingFrames;
    },

    update: function(data){
        if(data.path) this.move(data.path);
        if(data.stop) this.stop();
        Engine.handleBattleUpdates(this,data);
        if(data.dead) this.die();
    },

    remove: function(){
        //Engine.displayedAnimals.delete(this.id);
        Engine.entityManager.removeFromDisplayList(this);
        delete Engine.animals[this.id];
        this.destroy();
    },

    die: function(){
        this.setFrame(49);
        this.dead = true;
    },

    // ### INPUT ###

    handleClick: function(){
        if(BattleManager.inBattle){
            if(Engine.dead) return;
            BattleManager.processAnimalClick(this);
        }else{
            Engine.processAnimalClick(this);
        }
        Engine.interrupt = true;
    },

    handleOver: function(){
        if(BattleManager.inBattle) {
            var dx = Math.abs(this.tileX-Engine.player.tileX);
            var dy = Math.abs(this.tileY-Engine.player.tileY);
            var cursor = (dx+dy == 1 || (dx == 1 && dy == 1) ? Engine.swordCursor : Engine.bowCursor);
            Engine.setCursor(cursor);
        }
        Engine.tooltip.updateInfo((this.dead ? 'Dead ' : '')+this.name);
        Engine.tooltip.display();
    },

    handleOut: function(){
        if(BattleManager.inBattle) Engine.setCursor();
        Engine.tooltip.hide();
    }
});