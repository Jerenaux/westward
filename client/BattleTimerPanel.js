/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-02-18.
 */

function BattleTimerPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

BattleTimerPanel.prototype = Object.create(Panel.prototype);
BattleTimerPanel.prototype.constructor = BattleTimerPanel;

BattleTimerPanel.prototype.addInterface = function(){
    var x = 10;
    var y = 10;
    this.addPolyText(x,y,["It's ","Wolf","'s turn"],[null,null,null],16);
    this.texts.forEach(function(t){
        t.setOrigin(0.5,0);
    });
    y += 25;
    this.bar = new MiniProgressBar(this.x+x,this.y+y,this.width-40);
    this.bar.name = "battle timer";
    this.bar.setLevel(100,100);
};

BattleTimerPanel.prototype.updateText = function(name,isHero){
    var textY = this.y+10;
    var leftText = this.texts[0];
    var nameText = this.texts[1];
    var rightText = this.texts[2];
    nameText.setText(isHero ? 'your' : name);
    var x = Math.round(this.x+this.width/2);
    nameText.setPosition(x,textY);
    nameText.setFill(isHero ? Utils.colors.gold : Utils.colors.white);
    var leftTextX = nameText.x - nameText.width/2 - leftText.width/2;
    leftText.setPosition(leftTextX,textY);
    rightText.setText(isHero ? 'turn' : "'s turn");
    var rightTextX = nameText.x + nameText.width/2 + rightText.width/2;
    rightText.setPosition(rightTextX,textY);
};

BattleTimerPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.bar.display();
    this.displayTexts();
};

BattleTimerPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.bar.hide();
    this.hideTexts();
};