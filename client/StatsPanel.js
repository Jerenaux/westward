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
    this.stats = {};
    var tlx = 20;
    var tly = 25;
    var horizMargin = 100;
    var vertMargin = 30;
    var i = 0;
    for(var stat in Stats.dict) {
        if (!Stats.dict.hasOwnProperty(stat)) continue;
        var x = tlx + (i%3)*horizMargin;
        var y = tly + Math.floor(i/3)*vertMargin;
        this.addStat(this.x+x,this.y+y,stat);
        i++;
    }
    this.updateStats();
};

StatsPanel.prototype.addStat = function(x,y,s){
    console.log(x,y);
    var stat = Stats.dict[s];
    var statObj = {};
    var icon = Engine.scene.add.sprite(x,y,'icons2',stat.frame);
    icon.setScrollFactor(0);
    icon.setDisplayOrigin(0,0);
    icon.setDepth(Engine.UIDepth+1);
    icon.setVisible(false);
    statObj.icon = icon;
    this.content.push(icon);

    var text = Engine.scene.add.text(x+30, y, '', { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setScrollFactor(0);
    text.setDisplayOrigin(0,0);
    text.setDepth(Engine.UIDepth+1);
    text.setVisible(false);
    statObj.text = text;
    this.content.push(text);

    //var zone = Engine.scene.add.zone(x,y,90,30);
    var zone = Engine.scene.add.zone(x,y,90,30);
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.setVisible(false);
    zone.handleOver = function(){
        Engine.tooltip.updateInfo(stat.name);
        Engine.tooltip.display();
    };
    zone.handleOut = function(){
        Engine.tooltip.hide();
    };
    zone.setInteractive();
    statObj.zone = zone;
    this.content.push(zone);

    this.stats[s] = statObj;
};

StatsPanel.prototype.updateStats = function(){
    for(var stat in Stats.dict) {
        if (!Stats.dict.hasOwnProperty(stat)) continue;
        var value = Engine.player.getStat(stat);
        var statInfo = Stats.dict[stat];
        var suffix = statInfo.suffix;
        if(suffix) value = value+suffix;
        if(statInfo.showMax) value = value+"/"+statInfo.max;
        var statObj = this.stats[stat];
        statObj.text.setText(value);
    }
};

StatsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayStats();
};

StatsPanel.prototype.displayStats = function(){
    for(var stat in this.stats){
        if(!this.stats.hasOwnProperty(stat)) continue;
        var statObj = this.stats[stat];
        statObj.icon.setVisible(true);
        statObj.text.setVisible(true);
        statObj.zone.setVisible(true);
    }
};

/*StatsPanel.prototype.addStats = function(){
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
};*/