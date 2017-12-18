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
    var tlx = 20;
    var tly = 25;
    var horizMargin = 100;
    var vertMargin = 30;

    for(var i = 0; i < Stats.list.length; i++) {
        var key = Stats.list[i];
        var s = Stats.dict[key];
        var x = tlx + (i%3)*horizMargin;
        var y = tly + Math.floor(i/3)*vertMargin;
        var val = Engine.player.stats[key];
        // To add stuff to values (suffix, etc.), do it in Engine.updateStat()
        this.addStat(x,y,key,val,s.frame,s.name);
    }
    this.finalize();
};

StatsPanel.prototype.addStat = function(x,y,key,value,frame,name){
    var xpos = this.x + x;
    var ypos = this.y + y;
    var icon = Engine.scene.add.sprite(xpos,ypos,'icons2',frame);
    var text = Engine.scene.add.text(xpos+30, ypos, value,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    Engine.statsTexts[key] = text;

    var zone = Engine.scene.add.zone(xpos,ypos,90,30);
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.handleOver = function(){
        Engine.tooltip.updateInfo(name);
        Engine.tooltip.display();
    };
    zone.handleOut = function(){
        Engine.tooltip.hide();
    };

    this.container.push(zone);
    this.container.push(icon);
    this.container.push(text);
};