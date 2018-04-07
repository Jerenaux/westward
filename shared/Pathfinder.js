/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-18.
 */

var onServer = (typeof window === 'undefined');

/*
* PF in sparse matrix, check for world bounds,
* operate in arbitrary sparse grid, stops at boundaries of arbitrary grid,
* reusable, returns no path as soon as max length exceeded,
* option: avoid cells occupied by other entities, return duration together with path (computed incrementally)
* */

function Pathfinder(navGrid,exclusionGrid){
    this.grid = navGrid;
    this.exclusionGrid = exclusionGrid;
}

Pathfinder.prototype.findPath = function(from,to){
    var start = new Node(from.x,from.y);
    var end = new Node(to.x,to.y);
    var closedSet = new Set(); // Set of nodes already evaluated
    var openSet = new Set([start]); // The set of currently discovered nodes that are not evaluated yet
    var cameFrom = {}; // For each node, which node it can most efficiently be reached from
    start.setH(this.h(start,end));
    var minFNode = start; // node in openSet having the lowest f score
    //var gScore = new Map([start,0]); // For each node, the cost of getting from the start node to that node
    //var fScore = new Map([start,this.h(start,end)]); // For each node, the total cost of getting from the start node to the goal by passing by that node

    while(openSet.size > 0){
        if(minFNode.equals(end)) return this.backtrack(minFNode);

        // TODO: replace openSet by ordered list: make an add mehod that inserts
        // at the right index, and a remove that removes at the right position
        openSet.delete(minFNode);
        closedSet.add(minFNode);

        // TODO: only one pass over neighbors, using a generator
        var neighbors = this.generateNeighbors(minFNode);
        neighbors.forEach(function(n){

        },this);
    }
};

Pathfinder.prototype.generateNeighbors = function(node){
    var neighbors = [];
    var offsets = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    offsets.forEach(function(o){
        var n = new Node(node.x+o[0],node.y+o[1]);
        if(this.isWalkable(n)) neighbors.push(n);
    },this);
};

Pathfinder.prototype.isWalkable = function(node){
    return (
        node.x >= 0 && node.y >= 0
        && node.x < World.worldWidth && node.y < World.worldHeight
        && !this.grid.get(node.x,node.y)
    )
};

Pathfinder.prototype.backtrack = function(node){

};

Pathfinder.prototype.h = function(A,B){
    return Utils.euclidean(A,B);
};

function Node(x,y){
    this.x = x;
    this.y = y;
    this.g = 0;
    this.h = 0;
}

Node.prototype.setG = function(g){
    //the cost of getting from the start node to that node
    this.g = g;
    this.updateF();
};

Node.prototype.setH = function(h){
    this.h = h;
    this.updateF();
};

Node.prototype.updateF = function(){
    // the total cost of getting from the start node to the goal by passing by that node
    this.f = this.g+this.h;
};

Node.prototype.equals = function(B){
    return (this.x == B.x && this.y == B.y);
};

if (onServer) module.exports.Pathfinder = Pathfinder;