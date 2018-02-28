/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 26-02-18.
 */

function RespawnPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

RespawnPanel.prototype = Object.create(Panel.prototype);
RespawnPanel.prototype.constructor = RespawnPanel;

RespawnPanel.prototype.addInterface = function(){
    var x = this.width/2;
    var y = 10;
    var txt = this.addText(x,y,'You are dead!',Utils.colors.white,16);
    txt.setOrigin(0.5,0);
    y += 25;
    this.waitTxt = this.addText(x,y,'Waiting to respawn...',Utils.colors.white,16);
    this.waitTxt.setOrigin(0.5,0);
    y += 30;
    this.bar = new MiniProgressBar(this.x+10,this.y+y,this.width-40);
    this.bar.name = "respawn timer";
    this.bar.setLevel(100,100)
    var btnx = (this.width-100)/2;
    this.button = new BigButton(this.x+btnx,this.y+y-15,'Respawn',Engine.respawnClick.bind(this));
};

RespawnPanel.prototype.trigger = function(){
    this.bar.setCallback(this.showButton.bind(this));
    this.bar.setLevel(0,100,10*1000);
};

RespawnPanel.prototype.showButton = function(){
    this.bar.hide();
    this.waitTxt.setVisible(false);
    this.button.display();
};

RespawnPanel.prototype.display = function(){
    this.bar.setLevel(100,100);
    Panel.prototype.display.call(this);
    this.bar.display();
    this.displayTexts();
    this.trigger();
};

RespawnPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.bar.hide();
    this.button.hide();
    this.hideTexts();
};