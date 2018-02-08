
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
    // ffd700
    //this.addText(x,y,'Population: 12     |     Level: 1');
    x += this.addText(x,y,"Population: ").width;
    x += this.addText(x,y,"12",'#ffd700').width;
    x += this.addText(x,y,"    |    Level: ").width;
    this.addText(x,y,"1",'#ffd700');
    x = startx;
    y += 20;
    x += this.addText(x,y,"Food surplus:").width;
    this.addText(x,y,"-20%",'#ee1111');
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