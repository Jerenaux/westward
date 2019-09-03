/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */
import BigButton from './BigButton'
import {BigProgressBar} from "./ProgressBar"
import Engine from './Engine'
import Panel from './Panel'
import Utils from '../shared/Utils'

import buildingsData from '../assets/data/buildings.json'
import itemsData from '../assets/data/items.json'

function ConstructionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.bigbuttons = [];
    this.addInterface();
}

ConstructionPanel.prototype = Object.create(Panel.prototype);
ConstructionPanel.prototype.constructor = ConstructionPanel;

ConstructionPanel.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('prices');// || Engine.currentMenu.isPanelDisplayed('goldaction');
};

ConstructionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Building under construction',null,20).setOrigin(0.5);
    var barw = this.width-100;
    var barx = (this.width-barw)/2;
    this.bar = new BigProgressBar(this.x+barx,this.y+50,barw,'gold');
    this.bar.name = 'construction progress bar';

    var btnsx = this.x + this.width - 300;
    var btnsy = this.y + this.height - 25;
    Engine.addAdminButtons(this,btnsx,btnsy);
};

ConstructionPanel.prototype.displayInterface = function(){
    this.bar.display();
    this.displayTexts();

    if(Engine.currentBuiling.isOwned()) {
        this.pricesBtn.display();
        this.ggBtn.display();
        this.tgBtn.display();
    }

    var materials = buildingsData[Engine.currentBuiling.buildingType].recipe;
    if(!materials) return;
    var i = 0;
    var total_needed = 0;
    var total_owned = 0;
    console.warn(materials);
    for(var item in materials){
        var nb = materials[item];
        var slot = this.getNextLongSlot();
        var y = this.y + 100 + (i++ * 50);
        slot.setUp(this.x+20, y);
        var itemData = itemsData[item];
        slot.addIcon(itemData.atlas,itemData.frame);
        slot.addText(43,2,itemData.name,null,13);
        var owned = Engine.currentBuiling.getItemNb(item);
        slot.addText(43,17,owned+'/'+nb,(owned >= nb ? Utils.colors.green : Utils.colors.red),13);
        var player_owned = Engine.player.getItemNb(item);


        var txt = slot.addText(152,slot.height-3,player_owned,Utils.colors.white,13);
        txt.setOrigin(1,1);
        slot.addImage(161, slot.height-10, 'UI', 'smallpack');

        var price = Engine.currentBuiling.getPrice(item,'buy');
        var priceTxt = price || '--';
        var t = slot.addText(152,12,priceTxt,Utils.colors.white,13);
        t.setOrigin(1,0.5);
        slot.addImage(160, 13, 'UI', 'gold');
        slot.display();

        var panel_ = this;
        var btn = new BigButton(this.x+270,y+20,'Give '+itemData.name);
        btn.item = item;
        btn.callback = function(){
            if(panel_.checkForPanelOnTop()) return;
            Engine.currentMenu.displayPanel('action');
            Engine.currentMenu.panels['action'].setUp(this.item,'sell',false); // false = force non-financial
        }.bind(btn);
        btn.display();
        this.bigbuttons.push(btn);

        if(!Engine.currentBuiling.isOwned() && price > 0) {
            var btn = new BigButton(this.x + 410, y + 20, 'Sell ' + itemData.name);
            btn.item = item;
            btn.callback = function(){
                if(panel_.checkForPanelOnTop()) return;
                Engine.currentMenu.displayPanel('action');
                Engine.currentMenu.panels['action'].setUp(this.item,'sell',true); // true = force financial
            }.bind(btn);
            btn.display();
            this.bigbuttons.push(btn);
        }

        total_needed += nb;
        total_owned += owned;
    }
    console.warn(total_owned,total_needed);
    this.bar.setLevel(total_owned,total_needed);
};

ConstructionPanel.prototype.update = function(){
    this.hideLongSlots();
    this.bigbuttons.forEach(function(btn){
        btn.hide();
    });
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

export default ConstructionPanel