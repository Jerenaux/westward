
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
    var data = Engine.currentBuiling;
    this.populationTxt.setText(data.population);
    this.surplusTxt.setText(data.foodsurplus+'% ');
    this.surplusTxt.setFill(data.foodsurplus > 0 ? Utils.colors.green : Utils.colors.red);
    var needed = data.population*20;
    var owned = data.getItemNb(1);
    this.foodRatioTxt.setText(" ("+owned+"/"+needed+")");
};

SettlementStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};