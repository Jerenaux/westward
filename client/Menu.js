/**
 * Created by Jerome on 07-10-17.
 */

function Menu(title){
    this.container = [];

    var titlex = 780;
    var titley = 10;
    var textx = 990;
    var texty = 10;

    Engine.makeTitle(titlex,titley,165,this.container);
    var text = Engine.scene.add.text(textx, texty, title,
        { font: '32px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    text.setOrigin(1,0);
    this.container.push(text);

    this.container.forEach(function(e){
        e.depth = Engine.UIDepth;
        e.setScrollFactor(0);
        if(e.constructor.name == 'Sprite'){
            //e.setDisplayOrigin(0,0);
            e.displayOriginX = 0;
            e.displayOriginY = 0;
        }
        e.setInteractive();
    });
}
