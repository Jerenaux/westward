
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
    this.addPolyText(x,y,["Population: ","12","    |    Dev. Level: ","1"],[null,Utils.colors.gold,null,Utils.colors.gold]);
    y += 20;
    this.addPolyText(x,y,["Food surplus: ","-20%"],[null,Utils.colors.red]);
};

SettlementStatusPanel.prototype.displayInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    });
};

SettlementStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};