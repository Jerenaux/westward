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
    var txts = this.addPolyText(x,y,["Level ","1"," Merchant   -   ",classxp+"/100"," "+UI.textsData['classxp']],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    this.classText = txts[2];
    y += 30;
    var classbar = new MiniProgressBar(this.x+x,this.y+y,245);
    classbar.name = 'class xp bar';
    classbar.setLevel(classxp,100);
    this.bars.push(classbar);
    y += 15;

    var txts = this.addPolyText(x,y,["Level ","1"," citizen   -   ","10/100"," Civic XP"],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    this.civicXPtxt = txts[3];
    y += 30;
    this.civicbar = new MiniProgressBar(this.x+x,this.y+y,245);
    this.civicbar.name = 'civic xp bar';
    this.civicbar.setLevel(0,100);
    this.bars.push(this.civicbar);
    y += 20;

    this.addPolyText(x,y,['Respawn location: ','Fort ','of ',Engine.settlementsData[Engine.player.settlement].name],[null,Utils.colors.gold,null,Utils.colors.gold]);
    y += 30;
    this.addText(x,y,'Stats modifiers:');
    y+= 15;
    var txts = this.addPolyText(x,y,['-100% ','fatigue'],[null,null]);
    this.fatigueText = txts[0];
    y += 15;
    var txts = this.addPolyText(x,y,['-100% ','food deficit'],[Utils.colors.red,null]);
    this.foodModifierTxt = txts[0];
    this.foodModifierLabel = txts[1];
};

CharacterPanel.prototype.update = function(){
    this.classText.setText(" "+UI.classesData[Engine.player.class].name+"   -   ");
    this.fatigueText.setText('0%');
    this.civicXPtxt.setText(Engine.player.civicxp+'/'+Engine.player.maxcivicxp);
    this.civicbar.setLevel(Engine.player.civicxp,Engine.player.maxcivicxp);
    var foodModifier = Formulas.decimalToPct(Formulas.computePlayerFoodModifier(Formulas.pctToDecimal(Engine.player.foodSurplus)));
    this.foodModifierTxt.setFill(foodModifier < 0 ? Utils.colors.red : Utils.colors.green);
    this.foodModifierLabel.setText(Engine.player.foodSurplus >= 0 ? 'Food surplus' : 'Food deficit');
    if(foodModifier > 0) foodModifier = '+'+foodModifier;
    this.foodModifierTxt.setText(foodModifier+"%");
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