/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

function ConstructionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

ConstructionPanel.prototype = Object.create(Panel.prototype);
ConstructionPanel.prototype.constructor = ConstructionPanel;

ConstructionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Building under construction',null,20).setOrigin(0.5);
    this.progressText = this.addText(this.width/2,50,'50%',null,20).setOrigin(0.5);
    this.incrementText = this.addText(this.width/2,75,'(+10%/day)',Utils.colors.gold,16).setOrigin(0.5);
    var barw = this.width-100;
    var barx = (this.width-barw)/2;
    this.bar = new BigProgressBar(this.x+barx,this.y+100,barw,'gold');
    this.bar.name = 'construction progress bar';
    var btnx = (this.width-100)/2;
    this.button = new BigButton(this.x+btnx,this.y+250,'Commit!',Engine.commitClick);
};

ConstructionPanel.prototype.update = function(){
    var data = Engine.currentBuiling;
    this.bar.setLevel(data.progress);
    this.progressText.setText(this.bar.getPct()+'%');
    var increment = Formulas.computeBuildIncrement(data.prod,Engine.buildingsData[data.buildingType].buildRate);//Math.round((data.prod/100)*Engine.buildingsData[data.buildingType].buildRate);
    this.incrementText.setText('(+'+increment+'%/cycle)');
    this.displayCommitButton();
};

ConstructionPanel.prototype.displayCommitButton = function(){
    if(Engine.canCommit()){
        this.button.display();
    }else{
        this.button.hide();
    }
};

ConstructionPanel.prototype.displayInterface = function(){
    this.update();
    this.bar.display();
    this.displayCommitButton();
    this.displayTexts();
};

ConstructionPanel.prototype.hideInterface = function(){
    this.bar.hide();
    this.button.hide();
    this.hideTexts();
};

ConstructionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ConstructionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};