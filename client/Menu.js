/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    this.container = [];
    this.panels = {};
    this.displayed = false;
    this.makeTitle(title);
}

Menu.prototype.makeTitle = function(title){
    this.title = new UIHolder(945,15,'right');
    this.title.setText(title);
    this.title.setButton(this.hide.bind(this));
};

Menu.prototype.addPanel = function(name,panel){
    this.panels[name] = panel;
};

Menu.prototype.setIcon = function(icon){
    this.icon = icon;
};

Menu.prototype.displayIcon = function(){
    this.icon.display();
};

Menu.prototype.hideIcon = function(){
    if(this.icon) this.icon.hide();
};

Menu.prototype.display = function(){
    if(Engine.inMenu) Engine.currentMenu.hide();
    if(Engine.inPanel) Engine.currentPanel.hide();

    if(!Engine.inBuilding) this.title.display();

    for(var p in this.panels){
        if(!this.panels.hasOwnProperty(p)) continue;
        var panel = this.panels[p];
        panel.display();
    }

    Engine.inMenu = true;
    Engine.currentMenu = this;
    Engine.hideMarker();
    this.displayed = true;
};

Menu.prototype.hide = function(){
    this.title.hide();

    for(var panel in this.panels){
        if(!this.panels.hasOwnProperty(panel)) continue;
        this.panels[panel].hide();
    }

    Engine.inMenu = false;
    Engine.currentMenu = null;
    Engine.showMarker();
    this.displayed = false;
};
