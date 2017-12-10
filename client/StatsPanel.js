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
        var s = Stats.list[i];
        var x = tlx + (i%3)*horizMargin;
        var y = tly + Math.floor(i/3)*vertMargin;
        this.addStat(x,y,s.key,s.icon,Engine.player.stats[s.key]);
    }
    this.finalize();
};

StatsPanel.prototype.addStat = function(x,y,key,icon,value){
    this.container.push(Engine.scene.add.sprite(this.x+x,this.y+y,'iconslot').setScale(0.65));
    var icon = Engine.scene.add.sprite(this.x+x+10,this.y+y+10,'icons',icon);
    icon.centered = true;
    var text = Engine.scene.add.text(this.x+x+25, this.y+y-3, value,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    Engine.statsTexts[key] = text;
    this.container.push(icon);
    this.container.push(text);
};