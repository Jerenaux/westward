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
    this.button = new BigButton(this.x+50,this.y+65,'Equip',this.sendUse.bind(this));
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
        this.button.setText(data.equipment ? 'Equip' : 'Use');
        this.button.enable();
        if(data.isAmmo && Engine.player.getEquipped(data.ammo) == -1){
            this.button.disable();
            this.warntext.setText('You need a '+Equipment.getData(data.ammo).name+' to be able to equip this!');
            this.warntext.setVisible(true);
        }
    }else{
        this.button.hide();
    }
};

ItemActionPanel.prototype.sendUse = function(){
    Client.sendUse(this.itemID);
    this.hide();
};

ItemActionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.icon.display();
    this.text.setVisible(true);
    this.button.display();
};

ItemActionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.icon.hide();
    this.text.setVisible(false);
    this.warntext.setVisible(false);
    this.button.hide();
};