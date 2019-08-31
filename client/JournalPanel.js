/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-19.
 */
import Panel from './Panel'

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
        t.setWordWrapWidth(this.width-150,false);
        this.texts.push(t);
    }
    return this.texts[this.textsCounter++];
};

JournalPanel.prototype.formatTime = function(stamp){
    var delta = Date.now() - stamp;
    var minute = 1000*60;
    var hour = minute*60;
    var day = hour*24;
    if(delta > 2*day){
        var d = Math.ceil(delta/day);
        return d+' day'+(d > 1 ? 's' : '')+' ago';
    }else if(delta > hour){
        var d  = Math.ceil(delta/hour);
        return d+' hour'+(d > 1 ? 's' : '')+' ago';
    }else if(delta > minute*5){
        // return (Math.ceil(delta/(minute*5))*5)+' min. ago';
        return 'Recently'
    }else{
        return 'Just now';
    }
};

JournalPanel.prototype.update = function(){
    this.hideContent();

    var y = this.y + 20;
    for(var i = 0; i < Engine.player.history.length; i++){
        var data = Engine.player.history[i];
        var time_txt = this.getNextText();
        var event_txt = this.getNextText();
        var time = data[0];
        var event = data[1];
        time_txt.setText('['+this.formatTime(time)+']');
        time_txt.setFill(Utils.colors.gold);
        event_txt.setText(event);
        event_txt.setFill(Utils.colors.white);
        // var y = this.y + 20 + i*20;
        time_txt.x = this.x + 15;
        time_txt.y = y;
        event_txt.x = this.x + 115;
        event_txt.y = y;
        time_txt.setVisible(true);
        event_txt.setVisible(true);

        y += event_txt.height;
        if(y > this.y + this.height - 40) break;
    }
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

export default JournalPanel