/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 02-06-19.
 */

function loadJSON(path,callback){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

var container = document.getElementById('graph');

loadJSON('/assets/data/items.json',function(items){
    var nodes = [];
    for(var id in items){
        nodes.push({id:id,label:items[id].name});
    }
    nodes = new vis.DataSet(nodes);

    var edges = [];
    for(var id in items){
        var itm = items[id];
        if(itm.recipe){
            for(var ingredient in itm.recipe){
                edges.push({from:id,to:ingredient});
            }
        }
    }
    edges = new vis.DataSet(edges);

    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
       /* layout: {
            hierarchical: {
                direction: "UD", // up-down
                sortMethod: "directed"
            }
        }*/
    };

    new vis.Network(container, data, options);
});
