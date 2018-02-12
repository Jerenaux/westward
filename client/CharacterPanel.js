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
    this.bars = [];
    var alignx = 15;
    var x = alignx;
    var y = 20;
    this.addText(x,y,'Citizen of '+Engine.settlementsData[Engine.player.settlement].name,null,null,Utils.fonts.fancy);
    y += 20;

    var classxp = 0;
    this.addPolyText(x,y,["Level ","1"," Merchant   -   ",classxp+"/100"," Class XP"],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    y += 30;
    var classbar = new MiniProgressBar(this.x+x,this.y+y,245);
    classbar.setLevel(classxp,100);
    this.bars.push(classbar);
    y += 15;

    var civicxp = Utils.randomInt(0,101);
    this.addPolyText(x,y,["Level ","1"," citizen   -   ",civicxp+"/100"," Civic XP"],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    y += 30;
    var civicbar = new MiniProgressBar(this.x+x,this.y+y,245);
    civicbar.setLevel(civicxp,100);
    this.bars.push(civicbar);
    y += 20;

    this.addPolyText(x,y,['Respawn location: ','Fort ','of ','New Beginning'],[null,Utils.colors.gold,null,Utils.colors.gold]);
    y += 30;
    this.addText(x,y,'Stats modifiers:');
    y+= 15;
    this.addPolyText(x,y,['-0% ','fatigue'],[null,null]);
    y += 15;
    this.addPolyText(x,y,['-10% ','food deficit'],[Utils.colors.red,null]);
};

CharacterPanel.prototype.displayInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    });
    this.bars.forEach(function(b){
        b.display();
    });
};

CharacterPanel.prototype.hideInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(false);
    });
    this.bars.forEach(function(b){
        b.hide();
    });
};


CharacterPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

CharacterPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};