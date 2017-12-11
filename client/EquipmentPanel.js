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
    this.addEquipSlot(150,50,'armor');
    this.addEquipSlot(100,65,'gun');
    this.addEquipSlot(100,115,'sword');
    this.addEquipSlot(200,65,'shield');
    this.addEquipSlot(200,15,'necklace');
    this.addEquipSlot(150,100,'belt');
    this.addEquipSlot(150,150,'boots');

    for(var i = 0; i < this.nbAccessories; i++){
        this.addEquipSlot(100+(50*i),200,'ring');
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