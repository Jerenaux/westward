/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 30-05-18.
 */

/**
 * Created by jeren on 07-01-18.
 */

function CitizenPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

CitizenPanel.prototype = Object.create(Panel.prototype);
CitizenPanel.prototype.constructor = CitizenPanel;

CitizenPanel.prototype.addInterface = function(){
    this.bars = [];
    var alignx = 160;
    var x = alignx;
    var y = 20;
    this.addText(x,y,'Citizen of '+Engine.settlementsData[Engine.player.settlement].name,null,null,Utils.fonts.fancy);
    y += 20;

    var txts = this.addPolyText(x,y,["Level ","1"," citizen   -   ","10/100"," Civic XP"],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    this.civicLvltxt = txts[1];
    this.civicXPtxt = txts[3];
    y += 30;
    this.civicbar = new MiniProgressBar(this.x+x,this.y+y,245);
    this.civicbar.name = 'civic xp bar';
    this.civicbar.setLevel(0,100);
    this.bars.push(this.civicbar);
    y += 20;

    this.addPolyText(x,y,['Respawn location: ','Fort ','of ',Engine.settlementsData[Engine.player.settlement].name],[null,Utils.colors.gold,null,Utils.colors.gold]);
    y += 30;
};

CitizenPanel.prototype.update = function(){
    var max = Formulas.computeMaxCivicXP(Engine.player.civiclvl);
    this.civicXPtxt.setText(Engine.player.civicxp+'/'+max);
    this.civicbar.setLevel(Engine.player.civicxp,max);
    this.civicLvltxt.setText(Engine.player.civiclvl);
};

CitizenPanel.prototype.displayInterface = function(){
    this.displayTexts();
    this.bars.forEach(function(b){
        b.display();
    });
    this.update();
};

CitizenPanel.prototype.hideInterface = function(){
    this.hideTexts();
    this.bars.forEach(function(b){
        b.hide();
    });
};

CitizenPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

CitizenPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};