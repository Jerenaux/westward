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
    classbar.name = 'class xp bar';
    classbar.setLevel(classxp,100);
    this.bars.push(classbar);
    y += 15;

    //var civicxp = Engine.player.civicxp; //Utils.randomInt(0,101);
    var txts = this.addPolyText(x,y,["Level ","1"," citizen   -   ","10/100"," Civic XP"],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    this.civicXPtxt = txts[3];
    y += 30;
    this.civicbar = new MiniProgressBar(this.x+x,this.y+y,245);
    this.civicbar.name = 'civic xp bar';
    this.civicbar.setLevel(0,100);
    this.bars.push(this.civicbar);
    y += 20;

    this.addPolyText(x,y,['Respawn location: ','Fort ','of ','New Beginning'],[null,Utils.colors.gold,null,Utils.colors.gold]);
    y += 30;
    this.addText(x,y,'Stats modifiers:');
    y+= 15;
    this.addPolyText(x,y,['-0% ','fatigue'],[null,null]);
    y += 15;
    var txts = this.addPolyText(x,y,['-10% ','food deficit'],[Utils.colors.red,null]);
    this.foodModifierTxt = txts[0];
};

CharacterPanel.prototype.update = function(){
    this.civicXPtxt.setText(Engine.player.civicxp+'/'+Engine.player.maxcivicxp);
    this.civicbar.setLevel(Engine.player.civicxp,Engine.player.maxcivicxp);
    //this.foodModifierTxt.setText();
};

CharacterPanel.prototype.displayInterface = function(){
    this.displayTexts();
    this.bars.forEach(function(b){
        b.display();
    });
    this.update();
};

CharacterPanel.prototype.hideInterface = function(){
    this.hideTexts();
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