/**
 * Created by Jerome on 29-11-17.
 */

var Tooltip = new Phaser.Class({

    Extends: Phaser.GameObjects. DOMElement,

    initialize: function Tooltip(){
        Phaser.GameObjects.DOMElement.call(this, UI.scene, 0, 0);
        UI.scene.add.displayList.add(this);

        this.createFromCache('tooltip');
        this.title = this.getChildByID('tooltip_title');
        this.body = this.getChildByID('tooltip_body');
        this.stat_table = this.getChildByID('stat');
        this.base_stat = this.getChildByID('base');
        this.fatigue_modifier = this.getChildByID('fatigue_modifier');
        this.equipment_modifier = this.getChildByID('equipment_modifier');
        this.effects = this.getChildByID('effects');
        this.effect_icon = this.getChildByID('effect_icon');
        this.effect_nb = this.getChildByID('effect_nb');
        this.owned = this.getChildByID('owned');
        this.owned_icon = this.getChildByID('owned_icon');
        this.owned_nb = this.getChildByID('owned_nb');

        this.setOrigin(0);
        this.setScrollFactor(0);
        this.hide();
    },

    updatePosition: function(x,y){
        this.setPosition(
            x + 10,
            y + 10
        );
        if(this.x + this.computeWidth() > UI.getGameWidth()) this.x -= (this.computeWidth() + 30);
        if(this.y + this.computeHeight() > UI.getGameHeight()) this.y -= (this.computeHeight() + 30);
    },

    updateInfo: function(type,data){
        this.clear();
        switch(type){
            case 'building':
                var bld = Engine.buildings[data.id];
                var owner = bld.isOwned() ? 'Your' : bld.ownerName+'\'s';
                this.setTitle(owner+' '+bld.name);
                break;
            case 'buildingdata':
                var bld = Engine.buildingsData[data.id];
                this.setTitle(bld.name);
                this.setBody(bld.desc);
                break;
            case 'free':
                if(data.title) this.setTitle(data.title);
                if(data.body) this.setBody(data.body);
                break;
            case 'pickupItem':
                if(data.id == -1) break;
                this.setNbOwned(Engine.itemsData[data.id].effects, Engine.player.getItemNb(data.id));
                // fall through
            case 'item':
                if(data.id == -1) break;
                var item = Engine.itemsData[data.id];
                this.setTitle(item.name ? item.name : '');
                this.setBody(item.desc ? item.desc : '');
                if(item.effects) this.setEffects(item.effects);
                break;
            case 'NPC':
                var npc = data.entityType == 'civ' ? Engine.civs[data.id] : Engine.animals[data.id];
                var name = (npc.dead ? 'Dead ' : '')+npc.name;
                this.setTitle(name);
                break;
            case 'slot':
                var slot = Equipment.slots[data.slot];
                this.setTitle(slot.name);
                this.setBody(slot.desc);
                break;
            case 'stat':
                var stat = Stats[data.stat];
                this.setTitle(stat.name);
                this.setBody(stat.desc);
                this.setStat(data.stat);
                break;
            default:
                break;
        }
    },

    clear: function(){
        this.setTitle('');
        this.setBody('');
        this.effects.style.display = 'none';
        this.owned.style.display = 'none';
        this.stat_table.style.display = 'none';
    },

    setTitle: function(text){
        this.title.innerText = text;
    },

    setBody: function(text){
        this.body.innerText = text;
    },

    setStat: function(stat){
        var statData = Engine.player.getStat(stat);
        this.base_stat.innerText = '= '+statData.getBaseValue(stat);
        var eq = statData.absoluteModifiers[0];
        var fatigue = statData.relativeModifiers[0];
        if(eq || fatigue) {
            this.stat_table.style.display = 'inline';
            if (eq) this.equipment_modifier.innerText = '+' + eq + ' (equipment)';
            if (fatigue) this.fatigue_modifier.innerText = fatigue + '% (vigor)';
            this.equipment_modifier.style.display = (eq ? 'inline' : 'none');
            this.fatigue_modifier.style.display = (fatigue ? 'inline' : 'none');
        }
    },

    setEffects: function(effects){
        for(var effect in effects) {
            this.effects.style.display = 'block';
            var frame = UI.statsFrames[Stats[effect].frame];
            this.effect_icon.style.backgroundPosition = '-' + frame.x + 'px -' + frame.y + 'px';
            this.effect_nb.innerHTML = '+'+effects[effect];
        }
    },

    setNbOwned: function(effects, nb){
        this.owned.style.display = 'block';
        // var effects = (this.effects.style.display == 'block');
        this.owned_icon.style.marginLeft = (effects ? '-16' : '0')+'px';
        this.owned_nb.innerHTML = nb;
    },

    getBodyText: function(){
        return this.body.innerText;
    },

    getTitleText: function(){
        return this.title.innerText;
    },

    computeWidth: function(){
        return Math.max(
            Math.min(this.getBodyText().length,40) * 6.5,
            this.getTitleText().length * 8
        );
    },

    computeHeight: function(){
        return (Math.ceil(this.getBodyText().length/40) * 15)+40;
    },

    display: function(){
        this.setVisible(true);
        this.displayed = true;
    },

    hide: function(){
        this.setVisible(false);
        this.displayed = false;
    }
});