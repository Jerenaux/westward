/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    this.container = [];
    this.panels = [];
    this.displayed = false;
    this.makeTitle(title);
}

Menu.prototype.makeTitle = function(title){
    var textx = 945;
    var texty = 15;

    var text = Engine.scene.add.text(textx, texty, title,
        { font: '32px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    text.setOrigin(1,0);
    this.container.push(text);

    var titlex = textx - text.width - 32;
    var titley = 10;
    var x = titlex;
    this.container.push(Engine.scene.add.sprite(x,titley,'UI','title-left'));
    x += 32+(text.width/2);
    this.container.push(Engine.scene.add.tileSprite(x,titley+32,text.width,64,'UI','title-center'));
    x = x+(text.width/2);
    var closeBtn = new UIElement(x,titley,'UI','title-close',this);
    this.container.push(closeBtn);

    this.container.forEach(function(e){
        e.depth = Engine.UIDepth;
        e.setScrollFactor(0);
        if(e.constructor.name == 'Sprite'){
            //e.setDisplayOrigin(0,0);
            e.displayOriginX = 0;
            e.displayOriginY = 0;
        }
        e.setInteractive();
        e.visible = false;
    });

    text.depth = Engine.UIDepth+1;
};

Menu.prototype.addPanel = function(panel){
    this.panels.push(panel);
};

Menu.prototype.display = function(){
    if(Engine.inMenu) Engine.currentMenu.hide();
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = true;
    }
    for(var j = 0; j < this.panels.length; j++){
        this.panels[j].display();
    }
    Engine.inMenu = true;
    Engine.currentMenu = this;
    this.displayed = true;
};

Menu.prototype.hide = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = false;
    }
    for(var j = 0; j < this.panels.length; j++){
        this.panels[j].hide();
    }
    Engine.inMenu = false;
    Engine.currentMenu = null;
    this.displayed = false;
};
