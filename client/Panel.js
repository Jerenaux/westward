/**
 * Created by Jerome on 06-10-17.
 */
function Panel(x,y){
    Engine.scene.add.sprite(x,y,'UI','panel-topleft');
    Engine.scene.add.sprite(x+32,y,'UI','panel-top');
    Engine.scene.add.sprite(x+64,y,'UI','panel-topright');
    Engine.scene.add.sprite(x,y+32,'UI','panel-left');
    Engine.scene.add.sprite(x+32,y+32,'UI','panel-center');
    Engine.scene.add.sprite(x+64,y+32,'UI','panel-right');
    Engine.scene.add.sprite(x,y+64,'UI','panel-bottomleft');
    Engine.scene.add.sprite(x+32,y+64,'UI','panel-bottom');
    Engine.scene.add.sprite(x+64,y+64,'UI','panel-bottomright');
    console.log('created');
}