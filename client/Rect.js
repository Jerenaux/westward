/**
 * Created by Jerome on 14-08-17.
 */


function Rect(x,y,w,h){
    this.id = Geometry.lastrectID++;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.points = [];
    this.points.push(new PIXI.Point(x,y));
    this.points.push(new PIXI.Point(x+w,y));
    this.points.push(new PIXI.Point(x+w,y+h));
    this.points.push(new PIXI.Point(x,y+h));
    for(var i = 0; i < this.points.length; i++){
        this.points[i].i = i;
        this.points[i].rectID = this.id;
        if(Engine.debug) Engine.drawCircle(this.points[i].x,this.points[i].y,5,Geometry.colors[this.id]);
    }
}

Rect.prototype.contains = function(pt){
    return (this.x < pt.x && pt.x < this.x+this.w && this.y < pt.y && pt.y < this.y+this.h);
};

// If a point lies within a rect, project it on the sides to identify new vertices
Rect.prototype.findIntersects = function(pt){
    var sect = [];
    var k = pt.i;
    if(k === undefined) return sect;
    if(k == 0){ // top left corner
        sect.push(this.projectRight(pt)); // project on right side
        sect.push(this.projectDown(pt)); // project on bottom
    }else if(k == 1){ // top right corner
        sect.push(this.projectLeft(pt)); // project on left side
        sect.push(this.projectDown(pt)); // project on bottom
    }else if(k == 2){ // bottom right corner
        sect.push(this.projectLeft(pt)); // project on left side
        sect.push(this.projectUp(pt)); // project on left side
    }else if(k == 3){ // bottom left corner
        sect.push(this.projectRight(pt)); // project on right side
        sect.push(this.projectUp(pt)); // project on left side
    }
    return sect;
};

Rect.prototype.projectUp = function(pt){
    return new PIXI.Point(pt.x,this.y);
};

Rect.prototype.projectRight = function(pt){
    return new PIXI.Point(this.x+this.w,pt.y);
};

Rect.prototype.projectDown = function(pt){
    return new PIXI.Point(pt.x,this.y+this.h);
};

Rect.prototype.projectLeft =function(pt){
    return new PIXI.Point(this.x,pt.y);
};