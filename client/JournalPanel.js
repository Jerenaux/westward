/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-19.
 */

function JournalPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,false);
    this.texts = [];
    this.textsCounter = 0;
}

JournalPanel.prototype = Object.create(Panel.prototype);
JournalPanel.prototype.constructor = JournalPanel;

JournalPanel.prototype.getNextText = function() {
    if (this.textsCounter >= this.texts.length) {
        var t = UI.scene.add.text(0, 0, '', {
            font: '14px ' + Utils.fonts.fancy,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        t.setDisplayOrigin(0, 0);
        t.setScrollFactor(0);
        t.setDepth(1);
        this.texts.push(t);
    }
    return this.texts[this.textsCounter++];
};

JournalPanel.prototype.update = function(){
    Engine.player.history.forEach(function(hist,i){
        var t = this.getNextText();
        t.setText(hist);
        t.x = this.x + 20;
        t.y = this.y + 20 + i*20;
    },this);
};


JournalPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};

JournalPanel.prototype.hideContent = function(){
    this.hideTexts();
    this.textsCounter = 0;
};

JournalPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideContent();
};