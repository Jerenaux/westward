/**
 * Created by Jerome on 22-09-17.
 */

var curves = [];
var shapes = [];
var selected = null;
var activeTool = 'pointer';

var canvas = document.getElementById("stage");
var ctx = canvas.getContext("2d");

function fix (e) {
    e = e || window.event;
    var target = e.target || e.srcElement,
        rect = target.getBoundingClientRect();
    e.offsetX = e.clientX - rect.left;
    e.offsetY = e.clientY - rect.top;
}

function setActiveTool(tool){
    activeTool = tool;
}

canvas.addEventListener("mousedown", handleDown);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleUp);

function handleDown(e){
    fix(e);
    console.log(e.offsetX+', '+ e.offsetY);
    var data = ctx.getImageData(e.offsetX, e.offsetY, 1, 1);
    console.log(data.data);
    switch(activeTool){
        case 'pointer':
            selected = findShape(e.offsetX, e.offsetY);
            break;
        case 'bezier':
            extendCurve(findShape(e.offsetX, e.offsetY));
            setActiveTool('pointer');
            break;
    }
}

function handleUp(){
    selected = null;
}

function handleMove(e){
    if(!selected) return;
    fix(e);
    selected.updateCoordinates(e.offsetX, e.offsetY);
}

function findShape(x,y){
    var p = {x:x,y:y};
    for(var i = 0; i < shapes.length; i++){
        if(shapes[i].contains(p)) return shapes[i];
    }
    return null;
}

function extendCurve(a){
    if(!a) return;
    var c = new Circle(a.x+20, a.y,5);
    var z = new Circle(a.x+50, a.y,5);
    addCurve(a,c,z);
}
// ###################################################

function Shape(x,y){
    this.x = x;
    this.y = y;
}

Shape.prototype.updateCoordinates = function(x,y){
    this.x = x;
    this.y = y;
    update();
};

function Circle(x,y,r){
    Shape.call(this,x,y);
    this.r = r;
}

Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;

Circle.prototype.contains = function(p){
    return (Math.abs(p.x-this.x) < this.r && Math.abs(p.y-this.y) < this.r);
};


// ###################################################

function randomCurve(){
    var a = new Circle(randomInt(0,700),randomInt(0,500),5);
    var c = new Circle(randomInt(0,700),randomInt(0,500),5);
    var z = new Circle(randomInt(0,700),randomInt(0,500),5);
    addCurve(a,c,z);
}

function addCurve(a,c,z){
    var curve = new Bezier(0,0,0,0,0,0);
    curve.points[0] = a;
    curve.points[1] = c;
    curve.points[2] = z;
    //console.log(curve.getLUT(20));
    curves.push(curve);
    shapes.push(a);
    shapes.push(c);
    shapes.push(z);
    update();
}

function update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackdrop();
    for(var i = 0; i < curves.length; i++){
        drawCurve(curves[i]);
        drawSkeleton(curves[i]);
    }
}

function drawBackdrop(){
    ctx.drawImage(document.getElementById('source'),0,0);
    playWithPixels();
}

function drawSkeleton(curve){
    drawLine(curve.points[1],curve.points[0]);
    drawLine(curve.points[1],curve.points[2]);
    drawPoint(curve.points[0]);
    drawPoint(curve.points[1]);
    drawPoint(curve.points[2]);
}

function drawPoint(p){
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

function drawLine(a,z){
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(z.x,z.y);
    ctx.stroke();
}

function drawCurve(curve){
    ctx.beginPath();
    ctx.bezierCurveTo(
        curve.points[0].x, curve.points[0].y,
        curve.points[1].x, curve.points[1].y,
        curve.points[2].x, curve.points[2].y
    );
    ctx.stroke();
    ctx.closePath();
}

function save(){
    var pts = [];
    for(var i = 0; i < curves.length; i++){
        var curve = curves[i];
        var steps = Math.round(getLength(curve)/10);
        console.log("steps = "+steps);
        pts = pts.concat(curve.getLUT(steps));
    }
    console.log(pts);
    for(var j = 0; j < pts.length; j++){
        drawPoint(pts[j]);
    }
}

function getLength(curve){
    return new Bezier(curve.points[0].x,curve.points[0].y,curve.points[1].x,curve.points[1].y,curve.points[2].x,curve.points[2].y).length();
}

function randomInt(low, high) { // [low, high[
    return Math.floor(Math.random() * (high - low) + low);
}

function playWithPixels(){
    //console.log(ctx.getImageData(736, 152, 1, 1));
    //for(var y = 0; y < 5; y++){
        var y = 152;
        for(var x = canvas.width; x > 0; x--){
            var data = ctx.getImageData(x, y, 1, 1).data;
            //console.log(data);
            if(data[0]+data[1]+data[2] < 300) {
                console.log('found at '+x+', '+y);
                //drawPoint({x:x,y:y});
                break;
            }
        }
    //}
}