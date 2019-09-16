/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-03-19.
 */
import Engine from './Engine'
import ItemSlot from './ItemSlot'
import Panel from './Panel'
import UI from './UI'
import Utils from '../shared/Utils'

import itemsData from '../assets/data/items.json'


var NB_PER_PAGE = 4;

function ShopInventoryPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.slotsCounter = 0;
    this.slots = [];
    this.currentPage = 0;
    this.starty = this.y+20;
}

ShopInventoryPanel.prototype = Object.create(Panel.prototype);
ShopInventoryPanel.prototype.constructor = ShopInventoryPanel;

ShopInventoryPanel.prototype.hadAdminButtons = function(){
    return (this.inventory == 'building' || this.inventory == 'crafting')
};

ShopInventoryPanel.prototype.addPagination = function(){
    this.pagetxts = this.addPolyText((this.width/2)-50,0,['Page','1','/','10']);
    this.pagetxts[1].setText(1);

    this.previousPage = UI.scene.add.sprite(this.pagetxts[0].x-30, 0,'UI','arrow');
    this.previousPage.flipX = true;
    this.nextPage = UI.scene.add.sprite(this.pagetxts[3].x+this.pagetxts[3].width+3, 0,'UI','arrow');

    this.nextPage.setInteractive();
    this.nextPage.on('pointerover',function(){
        this.nextPage.setFrame('arrow_lit');
    }.bind(this));
    this.nextPage.on('pointerout',function(){
        this.nextPage.setFrame('arrow');
    }.bind(this));
    this.nextPage.on('pointerdown',function(){
        this.nextPage.setFrame('arrow_pressed');
    }.bind(this));
    this.nextPage.on('pointerup',function(){
        this.currentPage = Utils.clamp(this.currentPage+1,0,this.nbpages);
        this.nextPage.setFrame('arrow');
        this.updateContent();
    }.bind(this));

    this.previousPage.setInteractive();
    this.previousPage.on('pointerover',function(){
        this.previousPage.setFrame('arrow_lit');
    }.bind(this));
    this.previousPage.on('pointerout',function(){
        this.previousPage.setFrame('arrow');
    }.bind(this));
    this.previousPage.on('pointerdown',function(){
        this.previousPage.setFrame('arrow_pressed');
    }.bind(this));
    this.previousPage.on('pointerup',function(){
        this.currentPage = Utils.clamp(this.currentPage-1,0,this.nbpages);
        this.previousPage.setFrame('arrow');
        this.updateContent();
    }.bind(this));

    this.nextPage.setVisible(false);
    this.previousPage.setVisible(false);
    this.nextPage.setOrigin(0);
    this.previousPage.setOrigin(0);
};

ShopInventoryPanel.prototype.setInventory = function(inventory){
    this.inventory = inventory;

    if(this.hadAdminButtons()){
        var btnsx = this.x + 70;
        var btnsy = this.starty+15;
        Engine.addAdminButtons(this,btnsx,btnsy);
    }

    var emptyMsg = (this.inventory == 'player' ? 'You don\' have any items' : 'The inventory of this shop is empty. Come back later!');
    this.nothingTxt = this.addText(this.width/2,0,emptyMsg);
    this.nothingTxt.setOrigin(0.5,0);
    this.nothingTxt.setVisible(false);

    this.addPagination();
};

ShopInventoryPanel.prototype.getInventory = function(){
    if(this.inventory == 'player'){
        return Engine.player.inventory;
    }else if(this.inventory == 'building'){
        return (Engine.currentBuiling ? Engine.currentBuiling.inventory : new Inventory(5));
    }else if(this.inventory == 'buildRecipes') {
        return Engine.player.buildRecipes;
    }else if(this.inventory == 'crafting'){
        // TODO: update clickable ingredients when adding owner recipes to this
        return Engine.player.craftRecipes;
    }else{
        console.warn('Unidentified inventory');
        return new Inventory(5);
    }
};

ShopInventoryPanel.prototype.listItems = function(){
    var items = this.getInventory().toList(true); // true = filter out zeroes
    items.sort(function(a,b){
        if(itemsData[a[0]].name < itemsData[b[0]].name) return -1;
        return 1;
    });
    return items;
};

ShopInventoryPanel.prototype.hasItem = function(item){
    return this.getInventory().hasItem(item);
};

ShopInventoryPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new ShopSlot(x,y,360,80));
    }

    return this.slots[this.slotsCounter++];
};

ShopInventoryPanel.prototype.updateContent = function(){
    this.nbpages = Math.max(1,Math.ceil(this.listItems().length/NB_PER_PAGE));
    this.currentPage = Utils.clamp(this.currentPage,0,this.nbpages-1);
    this.hideContent();
    this.refreshContent();
};

ShopInventoryPanel.prototype.refreshPagination = function(){
    var py = (this.hadAdminButtons() && Engine.currentBuiling.isOwned() ? this.y + 55 : this.y + 20);
    this.pagetxts.forEach(function(t){
        t.setVisible(true);
        t.y = py + 10;
    },this);
    this.pagetxts[3].setText(this.nbpages);
    this.pagetxts[1].setText(this.currentPage+1);
    this.nextPage.y = py + 12;
    this.previousPage.y = py + 12;
    if(this.currentPage+1 < this.nbpages) this.nextPage.setVisible(true);
    if(this.currentPage > 0) this.previousPage.setVisible(true);
    this.nothingTxt.y = py + 35;
};

ShopInventoryPanel.prototype.refreshContent = function(){
    var sloty = this.y + 55;
    if(this.hadAdminButtons() && Engine.currentBuiling.isOwned()) {
        this.tgBtn.display();
        this.ggBtn.display();
        this.pricesBtn.display();
        sloty = this.y + 90;
    }
    var items = this.listItems();
    this.refreshPagination();
    this.nothingTxt.setVisible(items.length == 0);
    var yOffset = 0;
    items.forEach(function(item,i){
        if(i < this.currentPage*NB_PER_PAGE) return;
        if(i >= (this.currentPage+1)*NB_PER_PAGE) return;
        var slot = this.getNextSlot(this.x+20,sloty+yOffset);
        var action = (this.inventory == 'player' ? 'sell' : 'buy');
        slot.display();
        slot.setUp(action,item[0],item[1]);
        yOffset += 90;
    },this);
};

ShopInventoryPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    this.refreshContent();
};

ShopInventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    if(this.pricesBtn){
        this.pricesBtn.hide();
        this.ggBtn.hide();
        this.tgBtn.hide();
    }
    this.currentPage = 0;
    this.hideContent();
};

ShopInventoryPanel.prototype.hideContent = function(){
    this.slots.forEach(function(slot){
        slot.hide();
    });
    this.slotsCounter = 0;
    this.pagetxts.forEach(function(t){
        t.setVisible(false);
    });
    // this.starty = this.y+20;
    this.nextPage.setVisible(false);
    this.previousPage.setVisible(false);
};

// -----------------------

function ShopSlot(x,y,width,height){
    ItemSlot.call(this,x,y,width,height);

    this.addChest();

    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

ShopSlot.prototype = Object.create(ItemSlot.prototype);
ShopSlot.prototype.constructor = ShopSlot;

ShopSlot.prototype.addChest = function(){
    this.chesticon = UI.scene.add.sprite(this.x + 20, this.y + 13, 'UI','chest');
    this.stocknb = UI.scene.add.text(this.x + 29, this.y+4, '999', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.chesticon);
    this.content.push(this.stocknb);
};

ShopSlot.prototype.setUp = function(action,item,nb){
    ItemSlot.prototype.setUp.call(this,action,item,nb);

    this.stocknb.setText(Engine.currentBuiling.getItemNb(item));

    this.zone.off('pointerup');
    this.zone.on('pointerup',function(){
        if(this.checkForPanelOnTop()) return;
        Engine.currentMenu.hidePanel('goldaction');
        Engine.currentMenu.displayPanel('action');
        Engine.currentMenu.panels['action'].setUp(item,action);
    }.bind(this));
};

export default ShopInventoryPanel