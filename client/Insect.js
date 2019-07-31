/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 26-07-19.
 */
var Insect = new Phaser.Class({

    Extends: Phaser.GameObjects.PathFollower,

    initialize: function Insect(x,y) {
        // var x = Engine.player.x + UI.getGameWidth()/2 - 100;
        // var y = Engine.player.y;
        Phaser.GameObjects.PathFollower.call(this,Engine.scene, null, x, y, 'butterfly');
        Engine.scene.add.displayList.add(this);
        Engine.scene.add.updateList.add(this);

        this.setDepth(10);
        // this.setScrollFactor(0);
        this.play('butterflap');

        // var points = [ 50, 400, 200, 200, 350, 300, 500, 500, 700, 400 ];
        // var curve = new Phaser.Curves.Spline(points);
        // this.setPath(curve);
        // this.startFollow(10000);
        this.startPath()
    },

    startPath: function(){
        var range = 50;
        var destX = Utils.randomInt(this.x-range,this.x+range);
        var destY = Utils.randomInt(this.y-range,this.y+range);
        // console.warn('flying from ',this.x,this.y,'to',destX,destY);

        var d = Utils.euclidean({
            x: this.x,
            y: this.y
        },{
            x: destX,
            y: destY
        });
        var duration = (d/90)*1000;
        // console.warn(d,duration);
        var angle = Phaser.Math.Angle.Between(this.x,this.y,destX,destY)*(180/Math.PI);
        angle += 90;
        this.setAngle(angle);

        Engine.scene.tweens.add(
        {
            targets: this,
            x: destX,
            y: destY,
            duration: duration,
            onComplete: this.startPath.bind(this)
        });
    },
});