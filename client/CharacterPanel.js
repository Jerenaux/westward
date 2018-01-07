/**
 * Created by jeren on 07-01-18.
 */

function CharacterPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

CharacterPanel.prototype = Object.create(Panel.prototype);
CharacterPanel.prototype.constructor = CharacterPanel;

CharacterPanel.prototype.addInterface = function(){
    this.texts = [];
    var x = 15;
    var y = 20;
    this.addText(x,y,'Citizen of '+Engine.settlementsData[Engine.player.settlement].name);
    y += 20;
    this.addText(x,y,"Level 1 Merchant\t  -   0/100 Class XP");
    y += 20;
    this.addText(x,y,'Level 1 citizen   -   0/100 Civic XP');
    y += 20;
};

CharacterPanel.prototype.addText = function(x,y,text){
    var t = Engine.scene.add.text(this.x+x, this.y+y, text, { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    t.setDisplayOrigin(0,0);
    t.setScrollFactor(0);
    t.setDepth(Engine.UIDepth+1);
    t.setVisible(false);
    this.texts.push(t);
    this.content.push(t);
};

CharacterPanel.prototype.displayInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    });
};

CharacterPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};