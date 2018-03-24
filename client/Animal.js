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
            if(Engine.debug) console.warn('duplicate animal ',data.id,'at',data.x,data.y,'last seen at ',
                Engine.animals[data.id].tileX,',',Engine.animals[data.id].tileY);
            Engine.animals[data.id].remove();
        }

        var animalData = Engine.animalsData[data.type];
        this.id = data.id;
        console.log('new ',data.id);

        Engine.animals[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.setPosition(data.x,data.y);
        this.setTexture(animalData.sprite);
        this.setFrame(animalData.frame);
        this.setDisplayOrigin(0);
        this.setVisible(true);
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
        console.log('remove ',this.id,'(',this.tileX,',',this.tileY,',',this.chunk,',)');
        CustomSprite.prototype.remove.call(this);
        delete Engine.animals[this.id];
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
        if(!BattleManager.inBattle && Engine.inMenu) return;
        if(BattleManager.inBattle) {
            var dx = Math.abs(this.tileX-Engine.player.tileX);
            var dy = Math.abs(this.tileY-Engine.player.tileY);
            var cursor = (dx+dy == 1 || (dx == 1 && dy == 1) ? UI.swordCursor : UI.bowCursor);
            UI.setCursor(cursor);
        }
        UI.tooltip.updateInfo((this.dead ? 'Dead ' : '')+this.name);
        UI.tooltip.display();
    },

    handleOut: function(){
        if(BattleManager.inBattle) UI.setCursor();
        UI.tooltip.hide();
    }
});