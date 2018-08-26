/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 19-08-18.
 */

function Rect(x,y,w,h){
    this.topLeft = {
        x: x,
        y: y
    };
    this.bottomRight = {
        x: x + w,
        y: y + h
    }
}

module.exports.Rect = Rect;