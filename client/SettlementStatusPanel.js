
function SettlementStatusPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

SettlementStatusPanel.prototype = Object.create(Panel.prototype);
SettlementStatusPanel.prototype.constructor = SettlementStatusPanel;

SettlementStatusPanel.prototype.addInterface = function(){
    this.texts = [];
    var startx = 15;
    var x = startx;
    var y = 20;
    var txts = this.addPolyText(x,y,["Population: ","0","    |    Dev. Level: ","1"],[null,Utils.colors.gold,null,Utils.colors.gold]);
    this.populationTxt = txts[1];
    y += 20;
    txts = this.addPolyText(x,y,["Food surplus: ","100%","(1000/1000)"],[null,null,null]);
    this.foodStatusTxt = txts[0];
    this.surplusTxt = txts[1];
    this.foodRatioTxt = txts[2]
    y += 20;
    this.addPolyText(x,y,["Trade tax: ","5%"],[null,Utils.colors.gold]);
};

SettlementStatusPanel.prototype.displayInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    });
    this.update();
};

SettlementStatusPanel.prototype.update = function(){
    var foodSurplus = Engine.currentBuiling.getFoodSurplus();
    var population = Engine.currentBuiling.getPopulation();
    this.populationTxt.setText(population);
    this.surplusTxt.setText(Math.round(foodSurplus)+'% ');
    this.surplusTxt.setFill(foodSurplus >= 0 ? Utils.colors.green : Utils.colors.red);
    var needed = population*20;
    var owned = Engine.currentBuiling.getItemNb(Engine.config.FOOD_ID);
    this.foodRatioTxt.setText(" ("+owned+"/"+needed+")");
    this.foodStatusTxt.setText(foodSurplus >= 0 ? 'Food surplus: ' : 'Food deficit: ');
};

SettlementStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};