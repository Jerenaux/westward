/**
 * Created by jeren on 10-12-17.
 */

function StatsPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addStats();
}

StatsPanel.prototype = Object.create(Panel.prototype);
StatsPanel.prototype.constructor = StatsPanel;

StatsPanel.prototype.addStats = function(){
    var tlx = 60;
    var tly = 25;
    var horizMargin = 90;
    var vertMargin = 30;

    for(var i = 0; i < Stats.list.length; i++) {
        var key = Stats.list[i];
        var s = Stats.dict[key];
        var x = tlx + (i%3)*horizMargin;
        var y = tly + Math.floor(i/3)*vertMargin;
        this.addStat(x,y,key,s.frame,Engine.player.stats[key]);
    }
    this.finalize();
};

StatsPanel.prototype.addStat = function(x,y,key,frame,value){
    var icon = Engine.scene.add.sprite(this.x+x,this.y+y,'icons2',frame);
    var text = Engine.scene.add.text(this.x+x+30, this.y+y, value,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    Engine.statsTexts[key] = text;
    this.container.push(icon);
    this.container.push(text);
};