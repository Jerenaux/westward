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

Pathfinder.prototype.setCallbacks = function(openCb, closeCb){
    this.openCb = openCb;
    this.closeCb = closeCb;
};

Pathfinder.prototype.findPath = function(from,to){
    var start = new Node(from.x,from.y);
    var end = new Node(to.x,to.y);
    var closedSet = new SpaceMap(); // Set of nodes already evaluated
    this.openSet = []; // The list of currently discovered nodes that are not evaluated yet
    this.cameFrom = {}; // For each node, which node it can most efficiently be reached from
    this.considered = 0;

    this.addToOpenSet(start);
    start.setG(0);
    start.setH(this.h(start,end));

    while(this.openSet.length > 0){
        var minFNode = this.openSet.shift();
        console.log('---');
        console.log('Fetching',minFNode.toString());
        this.considered++;
        if(this.considered > 10000){
            console.log('Early stop');
            break;
        }
        if(minFNode.equals(end)) return this.backtrack(minFNode);

        closedSet.add(minFNode.x,minFNode.y,1);
        if(this.closeCb) this.closeCb(minFNode.x,minFNode.y);
        //console.log(closedSet.toString());

        var neighbors = this.generateNeighbors(minFNode);
        neighbors.forEach(function(neighbor){
            console.log('Considering neighbor',neighbor.toString());
            //console.log(closedSet.toString(),closedSet.get(neighbor.x,neighbor.y));
            if(closedSet.get(neighbor.x,neighbor.y)) return;

            //TODO: when diagonal movement, switch to euclidean
            var g = minFNode.g + Utils.manhattan(minFNode,neighbor);
            console.log('G = ',g);
            if(g >= neighbor.g){
                console.log('G too high:',g,neighbor.g);
                return;
            }
            this.cameFrom[neighbor] = minFNode;
            neighbor.setG(g);
            neighbor.setH(this.h(neighbor,end));
            console.log('New values',neighbor.toString());

            this.addToOpenSet(neighbor);
            //console.log(this.openSet.toString());
        },this);
    }
    this.reset();
    return null;
};

Pathfinder.prototype.addToOpenSet = function(node){
    for(var i = 0; i < this.openSet.length; i++){
        if(node.f < this.openSet[i].f){
            this.openSet.splice(i,0,node);
            return;
        }else if(node.f == this.openSet[i].f){
            if(node.equals(this.openSet[i])) return;
        }
    }
    this.openSet.push(node);
    if(this.openCb) this.openCb(node.x,node.y);
};

Pathfinder.prototype.generateNeighbors = function(node){
    var neighbors = [];
    var offsets = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    offsets.forEach(function(o){
        var n = new Node(node.x+o[0],node.y+o[1]);
        if(this.isWalkable(n)) neighbors.push(n);
    },this);
    return neighbors;
};

Pathfinder.prototype.isWalkable = function(node){
    console.log('Walkable at ',node.x,',',node.y,':',this.grid.get(node.x,node.y));
    return (
        node.x >= 0 && node.y >= 0
        && node.x < World.worldWidth && node.y < World.worldHeight
        && !this.grid.get(node.x,node.y)
    )
};

Pathfinder.prototype.backtrack = function(node){
    //TODO: replace comeFrom by SpaceMap
    var path = [node];
    console.log(node,this.cameFrom);
    console.log('backtrack',node in this.cameFrom);
    while(node in this.cameFrom){
        node = this.cameFrom[node];
        path.push(node);
    }
    this.reset();
    return path;
};

Pathfinder.prototype.reset = function(){
    this.considered = 0;
    this.openSet = [];
    this.cameFrom = {};
};

Pathfinder.prototype.h = function(A,B){
    //return Utils.euclidean(A,B);
    //TODO: when diagonal movement, switch to euclidean
    return Utils.manhattan(A,B) - 2;
};

function Node(x,y){
    this.x = x;
    this.y = y;
    this.g = Infinity;
    this.h = 0;
    this.f = Infinity;
}

Node.prototype.toString = function(){
    return "["+this.x+","+this.y+"] (g = "+this.g+", h = "+this.h+", f = "+this.f+")";
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

Node.prototype.updateF = function(){
    // the total cost of getting from the start node to the goal by passing by that node
    this.f = this.g+this.h;
};

Node.prototype.equals = function(B){
    return (this.x == B.x && this.y == B.y);
};

if (onServer) module.exports.Pathfinder = Pathfinder;