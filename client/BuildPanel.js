/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-07-19.
 */

var NB_PER_PAGE = 4;

function BuildPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.slotsCounter = 0;
    this.slots = [];
    this.currentPage = 0;
    this.starty = this.y+20;

    var emptyMsg = "You can't built anything at the moment!";
    this.nothingTxt = this.addText(this.width/2,0,emptyMsg);
    this.nothingTxt.setOrigin(0.5,0);
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
}

BuildPanel.prototype = Object.create(Panel.prototype);
BuildPanel.prototype.constructor = BuildPanel;


BuildPanel.prototype.listItems = function(){
    var items = Engine.player.buildRecipes.toList(true); // true = filter out zeroes
    items.sort(function(a,b){
        if(Engine.itemsData[a[0]].name < Engine.itemsData[b[0]].name) return -1;
        return 1;
    });
    return items;
};


BuildPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new BuildSlot(x,y,260,80));
    }

    return this.slots[this.slotsCounter++];
};

BuildPanel.prototype.updateContent = function(){
    this.nbpages = Math.max(1,Math.ceil(this.listItems().length/NB_PER_PAGE));
    this.currentPage = Utils.clamp(this.currentPage,0,this.nbpages-1);
    this.hideContent();
    this.refreshContent();
};

BuildPanel.prototype.refreshPagination = function(){
    var py = this.y + 20;
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

BuildPanel.prototype.refreshContent = function(){
    var sloty = this.y + 55;
    var items = this.listItems();
    this.refreshPagination();
    this.nothingTxt.setVisible(items.length == 0);
    var yOffset = 0;
    items.forEach(function(item,i){
        if(i < this.currentPage*NB_PER_PAGE) return;
        if(i >= (this.currentPage+1)*NB_PER_PAGE) return;
        var slot = this.getNextSlot(this.x+20,sloty+yOffset);
        slot.display();
        slot.setUp(item[0]);
        yOffset += 90;
    },this);
};

BuildPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    this.refreshContent();
};

BuildPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    if(this.pricesBtn){
        this.pricesBtn.hide();
        this.ggBtn.hide();
        this.tgBtn.hide();
    }
    this.currentPage = 0;
    this.hideContent();
};

BuildPanel.prototype.hideContent = function(){
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

function BuildSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.zone = UI.scene.add.zone(this.x,this.y,width,height);
    this.zone.setInteractive();
    this.zone.setOrigin(0);
    this.zone.on('pointerover',function(){
        if(this.checkForPanelOnTop()) return;
        UI.tooltip.updateInfo('item',{id:this.itemID});
        UI.tooltip.display();
        UI.setCursor('item');
    }.bind(this));
    this.zone.on('pointerout',function(){
        if(this.checkForPanelOnTop()) return;
        UI.tooltip.hide();
        UI.setCursor();
    }.bind(this));

    this.content = [this.name, this.zone];

    this.addItem();
    // this.addInventoryCount();
}

BuildSlot.prototype = Object.create(Frame.prototype);
BuildSlot.prototype.constructor = BuildSlot;

BuildSlot.prototype.addItem = function(){
    this.slot = UI.scene.add.sprite(this.x + 30,this.y+this.height/2,'UI','equipment-slot');
    this.icon = UI.scene.add.sprite(this.x + 30, this.y + this.height/2);
    this.content.push(this.slot);
    this.content.push(this.icon);
};

BuildSlot.prototype.addInventoryCount = function(){
    this.bagicon = UI.scene.add.sprite(this.x + 19, this.y + this.height - 12, 'UI','smallpack');
    this.nb = UI.scene.add.text(this.x + 29, this.y + this.height - 22, '999', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.bagicon);
    this.content.push(this.nb);
};

BuildSlot.prototype.addPrice = function(){
    this.goldicon = UI.scene.add.sprite(this.x + this.width - 12, this.y + 16, 'UI','gold');
    this.price = UI.scene.add.text(this.x + this.width - 22, this.y + 6, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.price.setOrigin(1,0);
    this.content.push(this.goldicon);
    this.content.push(this.price);
};

BuildSlot.prototype.addEffect = function(){
    this.staticon = UI.scene.add.sprite(this.x + 70, this.y + 45, 'UI');
    this.effect = UI.scene.add.text(this.x + 83, this.y + 35, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.staticon);
    this.content.push(this.effect);
};

BuildSlot.prototype.addRarity = function(){
    this.rarity = UI.scene.add.text(this.x + 60, this.y + 60, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.rarity);
};

BuildSlot.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('prices') || Engine.currentMenu.isPanelDisplayed('goldaction');
};

BuildSlot.prototype.setUp = function(item){
    if(!this.displayed) console.warn('Setting up slot before displaying it');
    var itemData = Engine.buildingsData[item];
    this.icon.setTexture('aok',itemData.icon);
    this.name.setText(itemData.name);
    this.desc = itemData.desc;
    this.itemID = item;
    // this.nb.setText(Engine.player.getItemNb(item));
};

BuildSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
};

BuildSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
};
