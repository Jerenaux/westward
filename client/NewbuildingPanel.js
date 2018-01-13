/**
 * Created by jeren on 13-01-18.
 */

function NewbuildingPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.lastOrder = Date.now();
    this.addInterface();
}

NewbuildingPanel.prototype = Object.create(Panel.prototype);
NewbuildingPanel.prototype.constructor = NewbuildingPanel;

NewbuildingPanel.prototype.addInterface = function(){
    var slot = Engine.scene.add.sprite(this.x+20,this.y+30,'UI','equipment-slot');
    slot.setDepth(Engine.UIDepth+1);
    slot.setScrollFactor(0);
    slot.setDisplayOrigin(0,0);
    slot.setVisible(false);
    this.content.push(slot);
    this.slot = slot;

    var building = new ItemSprite();
    building.setPosition(this.x+20+18,this.y+30+18);
    building.showTooltip = false;
    this.content.push(building);

    var name = Engine.scene.add.text(this.x+65,this.y+25, '0',  { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    name.setVisible(false);
    name.setDepth(Engine.UIDepth+2);
    name.setScrollFactor(0);
    this.content.push(name);

    this.buttons.push(this.addButton(75,50,'red','close',this.cancelBuild.bind(this)));
    this.buttons.push(this.addButton(125,50,'green','ok',this.requestBuild.bind(this)));

    this.buildingInfo = {
        id: -1,
        sprite: building,
        nameText: name
    };
};

NewbuildingPanel.prototype.setUp = function(id){
    if(!this.displayed) this.display();
    var data = Engine.itemsData[id];
    this.buildingInfo.id = id;
    this.buildingInfo.sprite.setUp(id,data);
    this.buildingInfo.sprite.setVisible(true);
    this.buildingInfo.nameText.setText(data.name);
    this.buildingInfo.nameText.setVisible(true);
};

NewbuildingPanel.prototype.displayInterface = function(){
    this.slot.setVisible(true);
    this.buttons.forEach(function(b){
        //b.btn.disable();
        b.btn.setVisible(true);
        b.symbol.setVisible(true);
        b.ring.setVisible(true);
    });
};

NewbuildingPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    this.displayInterface();
};

NewbuildingPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    // No need to manually hide the buttons, addButton() adds them to content so the Panel hides them
    this.reset();
};

NewbuildingPanel.prototype.reset = function(){
    this.buildingInfo.id = -1;
};

NewbuildingPanel.prototype.requestBuild = function(){
    if(Date.now() - this.lastOrder < 200) return;
    //Client.sendPurchase(this.buildingInfo.id,this.buildingInfo.count,this.buildingInfo.action);
    this.lastOrder = Date.now();
};

NewbuildingPanel.prototype.cancelBuild = function(){
    this.reset();
    this.hide();
    /*this.buildingInfo.sprite.setVisible(false);
    this.buildingInfo.nameText.setVisible(false);*/
};