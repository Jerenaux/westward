/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-06-18.
 */

var OrientationPin = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function OrientationPin () {
        CustomSprite.call(this, UI.scene, 0, 0, 'orientation');
        //this.setDepth(5);
        this.setScrollFactor(0);
        this.setOrigin(0.5,1);
        this.setDepth(-1);

        this.data = {
            vert: Engine.camera.height,
            horiz: Engine.camera.width,
            horizTiles: Math.ceil(Engine.camera.width/World.tileWidth),
            vertTiles: Math.ceil(Engine.camera.height/World.tileHeight)
        };

        this.data.A = {
            x: -(this.data.horiz/(2*World.tileWidth)),
            y: -(this.data.vert/(2*World.tileHeight))
        };
        this.data.B = {
            x: (this.data.horiz/(2*World.tileWidth)),
            y: -(this.data.vert/(2*World.tileHeight))
        };
        this.data.C = {
            x: (this.data.horiz/(2*World.tileWidth)),
            y: (this.data.vert/(2*World.tileHeight))
        };
    },

    update: function(x,y){
        x -= Engine.player.tileX;
        y -= Engine.player.tileY;
        //var m = y/x;  slope
        // line: y = (y_c/x_c)*x   no intercept for lines going through origin
        // top: y = -9   equation of top size
        // => (yc/xc)*x = 9 <=> x = -9*xc/yc;
        // bottom: y = 10
        var A = this.data.A;
        var B = this.data.B;
        var C = this.data.C;

        var d1 = Math.sign(x*B.y - y*B.x);
        var d2 = Math.sign(x*A.y - y*A.x);
        /*
        *       1, -1
        * 1,1           -1, -1
        *       -1, 1
        * */
        var xp, yp, angle, maxdist;
        if(d1 == 1 && d2 == -1){
            xp = A.y*(x/y);
            yp = A.y;
            angle = 180;
            maxdist = 1.5*this.data.vertTiles;
        }else if(d1 == -1 && d2 == -1){
            xp = B.x;
            yp = B.x*(y/x);
            angle = -90;
            maxdist = 1.5*this.data.horizTiles;
        }else if(d1 == -1 && d2 == 1){
            xp = C.y*(x/y);
            yp = C.y;
            angle = 0;
            maxdist = 1.5*this.data.vertTiles;
        }else if(d1 ==1 && d2 == 1) {
            xp = A.x;
            yp = A.x * (y / x);
            angle = 90;
            maxdist = 1.5 * this.data.horizTiles;
        }else if(d1 == -1 && d2 == 0){ // bottom-right corner
            xp = C.x;
            yp = C.y;
            angle = -45;
            maxdist = 1.5 * this.data.horizTiles;
        }else if(d1 == 0 && d2 == 1){ // bottom-left corner
            xp = A.x;
            yp = C.y;
            angle = 45;
            maxdist = 1.5 * this.data.horizTiles;
        }else if(d1 == 0 && d2 == 1){ // top-right corner
            xp = B.x;
            yp = B.y;
            angle = -135;
            maxdist = 1.5 * this.data.horizTiles;
        }else if(d1 == 1 && d2 == 0){ // top-left corner
            xp = A.x;
            yp = A.y;
            angle = 135;
            maxdist = 1.5 * this.data.horizTiles;
        }else{
            console.warn('no sector (x=',x,', y = ',y,', d1 = ',d1,', d2 = ',d2,')');
        }
        xp = this.data.horiz/2 + xp*World.tileWidth;
        yp = this.data.vert/2 + yp*World.tileHeight;

        this.setPosition(xp,yp);
        this.setAngle(angle);

        var dist = Math.max(Math.abs(x),Math.abs(y)); // chebyshev distance to origin
        var scale = 1-(dist/maxdist);
        this.setScale(Utils.clamp(scale,0.3,1));
    },

    display: function(){
        this.setVisible(true);
    },

    hide: function(){
        this.setVisible(false);
    }
});