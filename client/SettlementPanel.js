/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 20-03-18.
 */

function SettlementPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

SettlementPanel.prototype = Object.create(Panel.prototype);
SettlementPanel.prototype.constructor = SettlementPanel;

SettlementPanel.prototype.addBigButton = function(text){
    var id = this.settlementID;
    this.button = new BigButton(this.x+(this.width/2),this.y+this.height-20,text,function(){
        UI.selectSettlement(id);
    });
};

SettlementPanel.prototype.setUp = function(data){
    this.settlementID = data.id;
    var y = 15;
    var x = 10;
    this.addPolyText(x,y,['Population: ',data.pop,'   |   Buildings: ',data.buildings],
        [Utils.colors.normal,Utils.colors.gold,Utils.colors.normal,Utils.colors.gold]);
    y += 20;
    var label = (data.surplus > 0 ? 'Food surplus: ' : 'Food deficit: ');
    var value = Math.round(data.surplus)+'%';
    this.addPolyText(x,y,[label,value,'   |   Level: ',data.level],
        [Utils.colors.normal,(data.surplus > 0 ? Utils.colors.green : Utils.colors.red ),
        Utils.colors.normal,Utils.colors.gold]);
    y += 25;
    this.addText(x,y,data.desc);
    this.addBigButton('Choose');
};

SettlementPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    //if(this.button) this.button.display();
};
SettlementPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
    //if(this.button) this.button.hide();
};