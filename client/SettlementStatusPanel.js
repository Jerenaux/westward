
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
    txts = this.addPolyText(x,y,["Food surplus: ","0%"],[null,null]);
    this.surplusTxt = txts[1];
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
    this.surplusTxt.setText((data.foodsurplus*100)+'%');
    this.surplusTxt.setFill(data.foodsurplus > 0 ? Utils.colors.green : Utils.colors.red);
};

SettlementStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};