/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 13-02-18.
 */

function ProductivityPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

ProductivityPanel.prototype = Object.create(Panel.prototype);
ProductivityPanel.prototype.constructor = ProductivityPanel;

ProductivityPanel.prototype.addInterface = function(){
    var alignx = 10;
    var y = 20;
    var x = alignx;
    this.addPolyText(x,y,['+100%',' development level'],[null,null]);
    y += 15;
    var txts = this.addPolyText(x,y,['-1000%',' food deficit'],[Utils.colors.red,null]);
    this.foodText = txts[0];
    this.deficitText = txts[1];
    y += 15;
    txts = this.addPolyText(x,y,['+100%',' citizen commitment ','(2)'],[Utils.colors.green,null,Utils.colors.gold]);
    this.commitmentText = txts[0];
    this.nbCommittedText = txts[2];
    y += 15;
    txts = this.addPolyText(x,y,['Total: ','100%'],[null,Utils.colors.gold]);
    this.totalProd = txts[1];
};

ProductivityPanel.prototype.update = function(){
    var data = Engine.currentBuiling;
    var foodSurplus = Engine.currentBuiling.getFoodSurplus();
    this.totalProd.setText(data.prod+'%');
    this.nbCommittedText.setText('('+data.committed+')');
    var commitModifier = Formulas.commitmentProductivityModifier(data.committed);
    this.commitmentText.setText('+'+commitModifier+'%');
    this.commitmentText.setFill(commitModifier > 0 ? Utils.colors.green : Utils.colors.white);

    var foodModifier = Math.round(Formulas.computeSettlementFoodModifier(foodSurplus/100));

    this.foodText.setFill(foodModifier >= 0 ? Utils.colors.green : Utils.colors.red);
    this.deficitText.setText(foodModifier >= 0 ? 'food surplus' : 'food deficit');

    if(foodModifier >= 0) foodModifier = '+'+foodModifier;
    this.foodText.setText(foodModifier+'%');
};

ProductivityPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    //this.update();
};

ProductivityPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
};