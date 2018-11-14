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

ConstructionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Building under construction',null,20).setOrigin(0.5);
    /*this.progressText = this.addText(this.width/2,50,'50%',null,20).setOrigin(0.5);
    //this.incrementText = this.addText(this.width/2,75,'(+10%/day)',Utils.colors.gold,16).setOrigin(0.5);*/
    var barw = this.width-100;
    var barx = (this.width-barw)/2;
    this.bar = new BigProgressBar(this.x+barx,this.y+50,barw,'gold');
    this.bar.name = 'construction progress bar';
    //var btnx = this.width/2;*/
    //this.button = new BigButton(this.x+btnx,this.y+260,'Commit!',Engine.commitClick);
};

ConstructionPanel.prototype.update = function(){
    var data = Engine.currentBuiling;
    //this.bar.setLevel(data.progress);
    //this.progressText.setText(this.bar.getPct()+'%');
    //var increment = Formulas.computeBuildIncrement(data.prod,Engine.buildingsData[data.buildingType].buildRate);
    /*var rate = Engine.buildingsData[data.buildingType].buildRate;
    var increment = Formulas.computeBuildIncrement(Formulas.pctToDecimal(data.prod),rate);
    this.incrementText.setText('(+'+increment+'%/cycle)');*/
    //this.displayCommitButton();
};

/*ConstructionPanel.prototype.displayCommitButton = function(){
    if(Engine.canCommit()){
        this.button.display();
    }else{
        this.button.hide();
    }
};*/

ConstructionPanel.prototype.displayInterface = function(){
    this.bar.display();
    //this.displayCommitButton();
    this.displayTexts();

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
        slot.display();

        var btn = new BigButton(this.x+270,y+20,'Give '+itemData.name);
        btn.item = item;
        btn.callback = function(){
            Engine.giveClick(this.item);
        }.bind(btn);
        btn.display();
        this.bigbuttons.push(btn);
        var btn = new BigButton(this.x+410,y+20,'Sell '+itemData.name);
        btn.disable();
        btn.display();
        this.bigbuttons.push(btn);

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
};

ConstructionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ConstructionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};