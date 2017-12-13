/**
 * Created by Jerome on 28-11-17.
 */

function EquipmentPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.nbAccessories = 3;
    this.addEquip();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquip = function(){
    /*for(var i = 0; i < Equipment.list.length; i++){
        var equip = Equipment.list[i];
        var eq = Equipment.dict[equip];
        this.addEquipSlot(eq.x,eq.y,eq.shade);
    }

    var eq = Equipment.dict['acc'];
    for(var i = 0; i < Equipment.nbAccessories; i++){
        this.addEquipSlot(eq.x+(50*i),eq.y,eq.shade);
    }*/
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        for(var i = 0; i < eq.nb; i++) {
            var xinc = eq.xincrement || 0;
            this.addEquipSlot(eq.x+(i*xinc),eq.y,eq.shade);
        }
    }

    this.finalize();
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,name){
    var slot = Engine.scene.add.sprite(this.x+x,this.y+y,'UI','equipment-slot');
    slot.setInteractive();
    slot.handleOver = function(){
        Engine.tooltip.updateInfo(name.charAt(0).toUpperCase() + name.slice(1));
        Engine.tooltip.display();
    };
    slot.handleOut = function(){
        Engine.tooltip.hide();
    };
    var shade = Engine.scene.add.sprite(this.x+x+20,this.y+y+20,'UI',name+'-shade');
    shade.centered = true;
    this.container.push(slot);
    this.container.push(shade);
};