/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-18.
 */

function ItemActionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);

    this.icon = new ItemSprite(this.x + 30, this.y + 30);
    this.text = this.addText(50, 20,'',Utils.colors.white,16);
    this.warntext = this.addText(10, 105,'',Utils.colors.lightred,12);
    this.warntext.setOrigin(0,1);
    this.icon.showTooltip = false;
    this.useButton = new BigButton(this.x+50,this.y+65,'Equip',this.sendUse.bind(this));
    this.beltButton = new BigButton(this.x+140,this.y+65,'Put in belt',this.sendBelt.bind(this));
}

ItemActionPanel.prototype = Object.create(Panel.prototype);
ItemActionPanel.prototype.constructor = ItemActionPanel;

ItemActionPanel.prototype.setUp = function(itemID){
    var data = Engine.itemsData[itemID];
    this.itemID = itemID;
    this.icon.setUp(itemID,data);
    this.text.setText(data.name);
    this.warntext.setVisible(false);
    if(data.effects || data.equipment){
        this.useButton.setText(data.equipment ? 'Equip' : 'Use');
        this.useButton.enable();
        if(data.isAmmo && Engine.player.getEquipped(data.ammo) == -1){
            this.useButton.disable();
            this.warntext.setText('You need a '+Equipment.getData(data.ammo).name+' to be able to equip this!');
            this.warntext.setVisible(true);
        }

        var inBelt = Engine.player.belt.hasItem(itemID);
        this.beltButton.setText(inBelt ? 'Off belt' : 'In belt');
    }else{
        this.useButton.hide();
        this.beltButton.hide();
    }
};

ItemActionPanel.prototype.sendUse = function(){
    Client.sendUse(this.itemID);
    this.hide();
};

ItemActionPanel.prototype.sendBelt = function(){
    Client.sendBelt(this.itemID);
    this.hide();
};

ItemActionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.icon.display();
    this.text.setVisible(true);
    this.useButton.display();
    this.beltButton.display();
};

ItemActionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.icon.hide();
    this.text.setVisible(false);
    this.warntext.setVisible(false);
    this.useButton.hide();
    this.beltButton.hide();
};