/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-03-19.
 */

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

ShopInventoryPanel.prototype.setInventory = function(inventory){
    this.inventory = inventory;

    if(this.hadAdminButtons()){
        this.pricesBtn = new BigButton(this.x+70,this.starty+15,'Set prices',function(){
            Engine.currentMenu.displayPanel('prices');
            Engine.currentMenu.hidePanel('action');
            Engine.currentMenu.hidePanel('goldaction');
        });

        this.ggBtn = new BigButton(this.x+180,this.starty+15,'Give gold',function(){
            Engine.currentMenu.hidePanel('action');
            var ga = Engine.currentMenu.displayPanel('goldaction');
            ga.setUp('sell');
        });

        this.tgBtn = new BigButton(this.x+290,this.starty+15,'Take gold',function(){
            Engine.currentMenu.hidePanel('action');
            var ga = Engine.currentMenu.displayPanel('goldaction');
            ga.setUp('buy');
        });
    }

    this.nothingTxt = this.addText(20,0,'The inventory of this shop is empty. Come back later!');
    this.nothingTxt.setVisible(false);

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

ShopInventoryPanel.prototype.getInventory = function(){
    if(this.inventory == 'player'){
        return Engine.player.inventory;
    }else if(this.inventory == 'building'){
        return (Engine.currentBuiling ? Engine.currentBuiling.inventory : new Inventory(5));
    }else if(this.inventory == 'buildRecipes') {
        return Engine.player.buildRecipes;
    }else if(this.inventory == 'crafting'){
        return Engine.player.craftRecipes;
    }else{
        console.warn('Unidentified inventory');
        return new Inventory(5);
    }
};

ShopInventoryPanel.prototype.listItems = function(){
    items = this.getInventory().toList(true); // true = filter out zeroes
    items.sort(function(a,b){
        if(Engine.itemsData[a[0]].name < Engine.itemsData[b[0]].name) return -1;
        return 1;
    });
    return items;
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

    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

ShopSlot.prototype = Object.create(ItemSlot.prototype);
ShopSlot.prototype.constructor = ShopSlot;

ShopSlot.prototype.setUp = function(action,item,nb){
    ItemSlot.prototype.setUp.call(this,action,item,nb);

    this.zone.off('pointerup');
    this.zone.on('pointerup',function(){
        // if(Engine.currentMenu.panels['prices'].displayed) return;
        if(this.checkForPanelOnTop()) return;
        Engine.currentMenu.panels['goldaction'].hide();
        Engine.currentMenu.panels['action'].display();
        Engine.currentMenu.panels['action'].setUp(item,action);
    }.bind(this));
};
