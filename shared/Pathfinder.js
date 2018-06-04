/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-18.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
}

function Pathfinder(navGrid,maxLength,allowDiagonal,cutCorners,reverseWalkable){
    this.grid = navGrid;
    this.maxLength = maxLength || 50;
    this.allowDiagonal = allowDiagonal || false;
    this.cutCorners = cutCorners || false;
    this.reverseWalkable = reverseWalkable || false;
}

Pathfinder.prototype.setCallbacks = function(openCb, closeCb, backtrackCb){
    this.openCb = openCb;
    this.closeCb = closeCb;
    this.backtrackCb = backtrackCb;
};

Pathfinder.prototype.findPath = function(from,to){
    // todo: replac with 'closed' flag?
    var closedSet = new SpaceMap(); // Set of nodes already evaluated
    this.openSet = []; // The list of currently discovered nodes that are not evaluated yet
    // todo: replace with 'parent' fag?
    this.cameFrom = new SpaceMap(); // For each node, which node it can most efficiently be reached from
    this.nodes = new SpaceMap();
    this.considered = 0;

    var start = this.getNode(from.x,from.y);
    var end = this.getNode(to.x,to.y);

    this.addToOpenSet(start);
    start.setG(0);
    start.setH(this.heuristic(start,end));

    while(this.openSet.length > 0){
        this.considered++;

        var minFNode = this.getMinFNode();
        //console.log('Considering ',minFNode.toString());
        //log('log1','Considering '+minFNode.toString(),true);
        if(minFNode.equals(end)) return this.backtrack(minFNode);

        if(minFNode.g > this.maxLength){
            //console.log('Max length reached');
            break;
        }

        closedSet.add(minFNode.x,minFNode.y,1);
        if(this.closeCb) this.closeCb(minFNode.x,minFNode.y);

        var neighbors = this.generateNeighbors(minFNode,end);
        neighbors.forEach(function(neighbor){
            if(closedSet.get(neighbor.x,neighbor.y)) return;

            var g = minFNode.g + this.euclidean(minFNode,neighbor);

            //log('log1','Neighbor '+neighbor.toMiniString()+' : ng = '+g+" vs "+neighbor.g+", "+neighbor.opened);
            if(!neighbor.opened || g < neighbor.g) {
                this.cameFrom.add(neighbor.x, neighbor.y, minFNode);
                //log('log1', 'Parent of ' + neighbor.toMiniString() + 'set to' + minFNode.toMiniString());
                neighbor.setG(g);
                neighbor.setH(this.heuristic(neighbor, end));
                if (this.allowDiagonal) neighbor.setI(this.manhattan(neighbor, end));

                if(!neighbor.opened) this.addToOpenSet(neighbor);
            }
        },this);
        //log('log1',this.openSet.toString());
    }
    return null;
};

Pathfinder.prototype.getNode = function(x,y){
    var n = this.nodes.get(x,y);
    if(n) return n;
    var node = new Node(x,y);
    this.nodes.add(x,y,node);
    return node;
};

Pathfinder.prototype.getMinFNode = function(){
    if(this.allowDiagonal){
        return this.openSet.shift();
    }else{
        var minF = this.openSet[0].f;
        var g = this.openSet[0].g;
        var idcs = [];
        for(var i = 0; i < this.openSet.length; i++){
            var n = this.openSet[i];
            if(n.f == minF && n.g == g) idcs.push(i)
        }
        var j =  idcs[Math.floor(Math.random()*idcs.length)];
        return this.openSet.splice(j,1)[0];
    }
};

Pathfinder.prototype.addToOpenSet = function(node){
    if(this.openCb) this.openCb(node.x,node.y);
    var pos = this.openSet.length;
    for(var i = 0; i < this.openSet.length; i++){
        if(node.equals(this.openSet[i])) return;
        if(node.f < this.openSet[i].f){
            pos = i;
            break;
        }else if(node.f == this.openSet[i].f){
            if(node.h < this.openSet[i].h){
                pos = i;
                break;
            }else if(node.h == this.openSet[i].h){
                if(node.i < this.openSet[i].i){
                    pos = i;
                    break;
                }
            }
        }
    }
    this.openSet.splice(pos,0,node);
    node.opened = true;
};

Pathfinder.prototype.generateNeighbors = function(node){
    var neighbors = [];
    var offsets;
    if(this.allowDiagonal){
        offsets = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    }else{
        offsets = [[-1,0],[0,-1],[1,0],[0,1]];
    }

    offsets.forEach(function(o,i){
        var n = this.getNode(node.x+o[0],node.y+o[1]);
        if(!this.isWalkable(n)) return;
        if(this.allowDiagonal && !this.cutCorners && i%2 != 0){ // because corners are at odd positions in offsets array
            // Compute corner nodes that could be cut
            if(!this.isWalkable(this.getNode(node.x,node.y+o[1]))) return;
            if(!this.isWalkable(this.getNode(node.x+o[0],node.y))) return;
        }
        neighbors.push(n);
    },this);
    return neighbors;
};

Pathfinder.prototype.isWalkable = function(node){
    return (
        node.x >= 0 && node.y >= 0
        && node.x < World.worldWidth && node.y < World.worldHeight
        && this.canWalk(node.x,node.y)
    )
};

Pathfinder.prototype.canWalk = function(x,y){
    var get = this.grid.get(x,y);
    if(this.reverseWalkable) get = !get;
    return !get;
};

Pathfinder.prototype.backtrack = function(node){
    //console.log('Done after',this.considered,'fetches');
    var path = [];

    while(node){
        path.push([node.x,node.y]);
        if(this.backtrackCb) this.backtrackCb(node.x, node.y);
        node = this.cameFrom.get(node.x,node.y);
    }

    /*console.log('Path length:',path.length);
    console.log(path,path.toString());*/

    return path.reverse();
};

Pathfinder.prototype.manhattan = function(A,B){
    return Math.abs(A.x - B.x) + Math.abs(A.y - B.y);
};

Pathfinder.prototype.chebyshev = function(A,B){
    return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y));
};

Pathfinder.prototype.euclidean = function(A,B){
    return Math.sqrt(Math.pow(A.x-B.x,2)+Math.pow(A.y-B.y,2));
};

Pathfinder.prototype.heuristic = function(A,B){
    if(this.allowDiagonal){
        return this.chebyshev(A,B);
    }else {
        return this.manhattan(A,B);
    }
};

function Node(x,y){
    this.x = x;
    this.y = y;
    this.g = Infinity;
    this.h = 0;
    this.i = 0;
    this.f = Infinity;
    this.opened = false;
}

Node.prototype.toString = function(){
    return "["+this.x+","+this.y+"] (f = "+this.f+", g = "+this.g+", h = "+this.h+", i = "+this.i+", "+this.opened+")";
};

Node.prototype.toMiniString = function(){
    return "["+this.x+","+this.y+"]";
};

Node.prototype.setG = function(g){
    //the cost of getting from the start node to that node
    this.g = g;
    this.updateF();
};

Node.prototype.setH = function(h){
    this.h = h;
    this.updateF();
};

// Additional Manhattan-based heuristic to break ties
Node.prototype.setI = function(i){
    this.i = i;
};

Node.prototype.updateF = function(){
    // the total cost of getting from the start node to the goal by passing by that node
    this.f = this.g+this.h;
    //this.f = this.h;
};

Node.prototype.equals = function(B){
    return (this.x == B.x && this.y == B.y);
};

if (onServer) module.exports.Pathfinder = Pathfinder;