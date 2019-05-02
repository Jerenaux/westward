/**
 * Created by Jerome on 28-11-17.
 */

function EquipmentPanel(x,y,width,height,title,battleMenu){
    Panel.call(this,x,y,width,height,title);
    this.slots = [];
    this.battleMenu = battleMenu;
    this.addEquipment();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquipment = function(){
    for(var slot in Equipment.slots){
        this.makeSlots(slot,Equipment.slots[slot]);
    }
    for(var container in Equipment.containers){
        this.makeSlots(container,Equipment.containers[container]);
    }
    for(var ammo in Equipment.ammo){
        this.makeSlots(ammo,Equipment.ammo[ammo],true);
    }
    this.updateEquipment();
};

EquipmentPanel.prototype.makeSlots = function(label,data,displayNumber){
    if(this.battleMenu && !data.showInBattle) return;
    var xoffset = (this.battleMenu ? 10 : -40);
    var yoffset = (this.battleMenu? 10 : 0);
    var x = (this.battleMenu ? data.battlex : data.x) + xoffset;
    var y = (this.battleMenu ? data.battley : data.y) + yoffset;
    this.slots.push(this.addEquipSlot(x,y,data.name,data.desc,data.shade,displayNumber,label));
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,name,desc,shade,displayNumber,slotName){
    var slotObj = {};
    var slot = UI.scene.add.sprite(this.x+x,this.y+y,'UI','equipment-slot');
    var item = new ItemSprite(this.x+x+20,this.y+y+20);
    slot.setInteractive();
    slot.on('pointerover',UI.tooltip.display.bind(UI.tooltip));
    slot.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    slot.on('pointerup',Engine.unequipClick.bind(slotObj));
    slot.setDepth(1);
    slot.setScrollFactor(0);
    slot.setDisplayOrigin(0,0);
    slot.setVisible(false);

    if(displayNumber){
        var text = UI.scene.add.text(this.x+x+38, this.y+y+19, '0',{font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3});
        text.setOrigin(1,0);
        text.setScrollFactor(0);
        text.setVisible(false);
        text.setDepth(3);
        slotObj.text = text;
        this.content.push(text);
    }

    // Null = no value, -1 = nothing equipped
    slotObj.id = null; // id of the item
    slotObj.slot = slot; // slot sprite
    slotObj.item = item; // item sprite
    slotObj.shade = shade; // name of the shade frame
    slotObj.name = name; // name for the tooltip
    slotObj.desc = desc;
    slotObj.slotName = slotName; // name of the slot
    this.content.push(slot);
    this.content.push(item);
    return slotObj;
};

EquipmentPanel.prototype.updateEquipment = function(){
    this.slots.forEach(function(slot){
        var newItem = Engine.player.getEquipped(slot.slotName);
        var currentItem = slot.id;
        //if(newItem == currentItem) return;
        var data;
        if(newItem == -1){
            data = {
                id: -1,
                atlas: 'UI',
                frame: slot.shade+'-shade',
                name: slot.name,
                desc: slot.desc
            };
        }else{
            data = Engine.itemsData[newItem];
        }
        slot.item.setUp(newItem,data);
        slot.id = newItem;

        if(slot.text){
            if(newItem == -1) {
                slot.text.setVisible(false);
            }else{
                var nb = Engine.player.getNbAmmo(slot.slotName);
                slot.text.setText(nb);
                if(this.displayed){
                    var capacity = Engine.player.getMaxAmmo(slot.slotName);
                    var color = (nb == capacity ? Utils.colors.gold : Utils.colors.white);
                    slot.text.setFill(color);
                    slot.text.setVisible(true);
                }
            }
        }
    },this);
};

EquipmentPanel.prototype.displaySlots = function(){
    // Each entry of the map is a list of slotObj for the corresponding equipment slot
    this.slots.forEach(function(slot){
        slot.item.setVisible(true);
        slot.slot.setVisible(true);
        if(slot.text) {
            if(Engine.player.isAmmoEquipped(slot.slotName)) slot.text.setVisible(true);
        }
    });
};

EquipmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displaySlots();
};

// ------------------

function BattleEquipmentPanel(){
    Panel.call(this,0,0,0,0,'',true); // true = invisible

    var meleex = 950;
    var meleey = 515;
    var rangex = 1000;
    var rangey = 500;
    var lifex = 1000;
    var lifey = 550;
    var lifew = 200;
    var facebg = UI.scene.add.sprite(lifex,lifey,'UI','facebg');
    facebg.flipX = true;
    facebg.flipY = true;
    var lifebg = UI.scene.add.tileSprite(lifex-22-lifew/2,lifey+4,lifew,24,'UI','capsule-middle');
    lifebg.flipX = true;
    lifebg.flipY = true;
    var lifetip = UI.scene.add.sprite(lifebg.x-lifew/2,lifebg.y,'UI','capsule-left');
    lifetip.flipY = true;
    this.content.push(facebg);
    this.content.push( UI.scene.add.sprite(facebg.x,facebg.y,'faces',0));
    this.content.push(lifebg);
    this.content.push(lifetip);
    this.content.push(UI.scene.add.sprite(lifetip.x+5,lifetip.y,'UI','heart'));
    this.lifetext = UI.scene.add.text(lifetip.x+15, lifetip.y, '100/100',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0,0.5);
    this.content.push(this.lifetext);
    this.bar = new MiniProgressBar(this.lifetext.x+this.lifetext.width+5,lifetip.y-5,100,'red');
    this.bar.setLevel(100,100);
    this.bar.display();

    this.content.push(UI.scene.add.sprite(meleex,meleey,'UI','battleholder'));
    this.content.push(UI.scene.add.sprite(meleex,meleey,'UI','sword-shade').setAlpha(0.6));
    this.content.push(UI.scene.add.sprite(rangex,rangey,'UI','battleholder'));
    this.content.push(UI.scene.add.sprite(rangex,rangey,'UI','gun-shade').setAlpha(0.6));

    this.content.forEach(function(c){
        c.setScrollFactor(0);
    })
}

BattleEquipmentPanel.prototype = Object.create(Panel.prototype);
BattleEquipmentPanel.prototype.constructor = BattleEquipmentPanel;

BattleEquipmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    })
};