/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

function ConstructionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.bigbuttons = [];
    this.addInterface();
}

ConstructionPanel.prototype = Object.create(Panel.prototype);
ConstructionPanel.prototype.constructor = ConstructionPanel;

ConstructionPanel.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('prices') || Engine.currentMenu.isPanelDisplayed('goldaction');
};

ConstructionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Building under construction',null,20).setOrigin(0.5);
    /*this.progressText = this.addText(this.width/2,50,'50%',null,20).setOrigin(0.5);
    //this.incrementText = this.addText(this.width/2,75,'(+10%/day)',Utils.colors.gold,16).setOrigin(0.5);*/
    var barw = this.width-100;
    var barx = (this.width-barw)/2;
    this.bar = new BigProgressBar(this.x+barx,this.y+50,barw,'gold');
    this.bar.name = 'construction progress bar';

    var btnsy = this.y + this.height - 25;
    this.pricesBtn = new BigButton(this.x + this.width - 300,btnsy,'Set prices',function(){
        Engine.currentMenu.displayPanel('prices');
        Engine.currentMenu.hidePanel('action');
        Engine.currentMenu.hidePanel('goldaction');
    });

    this.ggBtn = new BigButton(this.x + this.width - 190,btnsy,'Give gold',function(){
        Engine.currentMenu.hidePanel('action');
        var ga = Engine.currentMenu.displayPanel('goldaction');
        ga.setUp('sell');
    });

    this.tgBtn = new BigButton(this.x + this.width - 80,btnsy,'Take gold',function(){
        Engine.currentMenu.hidePanel('action');
        var ga = Engine.currentMenu.displayPanel('goldaction');
        ga.setUp('buy');
    });
};

ConstructionPanel.prototype.displayInterface = function(){
    this.bar.display();
    this.displayTexts();

    if(Engine.currentBuiling.isOwned()) {
        this.pricesBtn.display();
        this.ggBtn.display();
        this.tgBtn.display();
    }

    var materials = Engine.buildingsData[Engine.currentBuiling.buildingType].recipe;
    if(!materials) return;
    var i = 0;
    var total_needed = 0;
    var total_owned = 0;
    for(var item in materials){
        var nb = materials[item];
        var slot = this.getNextLongSlot();
        var y = this.y + 100 + (i++ * 50);
        slot.setUp(this.x+20, y);
        var itemData = Engine.itemsData[item];
        slot.addIcon(itemData.atlas,itemData.frame);
        slot.addText(43,2,itemData.name,null,13);
        var owned = Engine.currentBuiling.getItemNb(item);
        slot.addText(43,17,owned+'/'+nb,(owned >= nb ? Utils.colors.green : Utils.colors.red),13);

        var price = Engine.currentBuiling.getPrice(item,'buy');
        var priceTxt = price || '--';
        var t = slot.addText(152,12,priceTxt,Utils.colors.white,13);
        t.setOrigin(1,0.5);
        slot.addImage(160, 13, 'UI', 'gold');
        slot.display();

        var btn = new BigButton(this.x+270,y+20,'Give '+itemData.name);
        btn.item = item;
        /*btn.callback = function(){
            Engine.giveClick(this.item);
        }.bind(btn);*/
        btn.callback = function(){
            if(this.checkForPanelOnTop()) return;
            Engine.currentMenu.displayPanel('action');
            Engine.currentMenu.panels['action'].setUp(item,'sell');
        }.bind(this);
        btn.display();
        this.bigbuttons.push(btn);

        if(!Engine.currentBuiling.isOwned() && price > 0) {
            var btn = new BigButton(this.x + 410, y + 20, 'Sell ' + itemData.name);
            btn.disable();
            btn.display();
            this.bigbuttons.push(btn);
        }

        total_needed += nb;
        total_owned += owned;
    }
    this.bar.setLevel(total_owned,total_needed);
};

ConstructionPanel.prototype.update = function(){
    this.hideLongSlots();
    this.displayInterface();
};

ConstructionPanel.prototype.hideInterface = function(){
    this.bar.hide();
    this.bigbuttons.forEach(function(b){
        b.hide();
    });
    this.hideTexts();
    this.hideLongSlots();
    this.pricesBtn.hide();
    this.ggBtn.hide();
    this.tgBtn.hide();
};

ConstructionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ConstructionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};