/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    // TODO ask Rich what would be the best approach for container
    this.container = [];
    this.displayed = false;

    var textx = 945;
    var texty = 15;

    var text = Engine.scene.add.text(textx, texty, title,
        { font: '32px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    text.setOrigin(1,0);
    this.container.push(text);

    var titlex = textx - text.width - 32;
    var titley = 10;
    Engine.makeTitle(titlex,titley,text.width,true,this.container);

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
}

Menu.prototype.display = function(){
    if(Engine.inMenu) Engine.currentMenu.hide();
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = true;
    }
    Engine.inMenu = true;
    Engine.currentMenu = this;
    this.displayed = true;
};

Menu.prototype.hide = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = false;
    }
    Engine.inMenu = false;
    Engine.currentMenu = null;
    this.displayed = false;
};
