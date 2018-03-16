/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    this.container = [];
    this.panels = {};
    this.events = {};
    this.hideOnOpen = {};
    this.displayed = false;
    if(title) this.makeTitle(title);
}

Menu.prototype.makeTitle = function(title){
    this.title = new UIHolder(945,15,'right','big',this.scene);
    this.title.setText(title);
    this.title.setButton(this.hide.bind(this));
};

Menu.prototype.addPanel = function(name,panel,hideOnOpen){
    this.panels[name] = panel;
    panel.name = name;
    this.hideOnOpen[name] = !!hideOnOpen;
    return panel;
};

Menu.prototype.addEvent = function(name,callback){
    this.events[name] = callback;
};

Menu.prototype.trigger = function(event){
    if(this.events[event]) this.events[event]();
};

Menu.prototype.setIcon = function(icon){
    this.icon = icon;
};

Menu.prototype.displayIcon = function(){
    if(this.icon) this.icon.display();
};

Menu.prototype.hideIcon = function(){
    if(this.icon) this.icon.hide();
};

Menu.prototype.display = function(){
    if(Engine.inMenu) Engine.currentMenu.hide();
    if(Engine.inPanel) Engine.currentPanel.hide();
    if(Engine.chatBar && Engine.chatBar.displayed) Engine.chatBar.hide();

    if(!Engine.inBuilding && this.title) this.title.display();

    Engine.currentMenu = this;
    for(var p in this.panels){
        if(!this.panels.hasOwnProperty(p)) continue;
        if(!this.hideOnOpen[p]) this.panels[p].display();
    }

    for(var event in this.events){
        if(!this.events.hasOwnProperty(event)) continue;
        this.trigger(event);
    }

    Engine.inMenu = true;
    Engine.hideMarker();
    this.displayed = true;
};

Menu.prototype.hide = function(){
    if(this.title) this.title.hide();

    for(var panel in this.panels){
        if(!this.panels.hasOwnProperty(panel)) continue;
        this.panels[panel].hide();
    }

    Engine.inMenu = false;
    Engine.currentMenu = null;
    Engine.showMarker();
    this.displayed = false;
};
