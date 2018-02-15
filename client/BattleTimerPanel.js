/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-02-18.
 */

function BattleTimerPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

BattleTimerPanel.prototype = Object.create(Panel.prototype);
BattleTimerPanel.prototype.constructor = BattleTimerPanel;

BattleTimerPanel.prototype.addInterface = function(){
    this.bar = new MiniProgressBar(this.x+10,this.y+15,this.width-40);
    this.bar.setLevel(100,100);
};

BattleTimerPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.bar.display();
};

BattleTimerPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.bar.hide();
};