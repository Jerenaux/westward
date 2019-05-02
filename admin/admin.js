/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 04-12-18.
 */

var app = angular.module('admin',[]);

var Data = {
    counter: 0,
    categories: ['buildings','items','animals']
};



app.controller("mainCtrl", [
    '$scope','$http',
    function($scope,$http) {

        getJSON = function(category){
            $http.get("/assets/data/"+category+".json").then(function(res) {
                if(res.status == 200){
                    Data[category+'Data'] = res.data;
                    Data.counter++;
                    if(Data.counter == Data.categories.length) getAllData();
                }
            },function(err){});
        };

        getData = function(category){
            $scope[category] = [];
            $http.get("/admin/"+category+"/").then(function(res) {
                if(res.status == 200) $scope[category] = res.data;
                console.log(res.data);
            },function(err){});
        };

        countItems = function(category){
            $http.get("/admin/count-items/").then(function(res) {
                if(res.status == 200) {
                    console.log(res.data);
                    $scope['items'] = [];
                    for(var item in res.data){
                        $scope['items'].push([item,res.data[item]]);
                    }
                    console.log($scope['items']);
                }
            },function(err){});
        };

        getAllData = function(){

            $scope.bldSortType = 'name';
            $scope.bldSortReverse = false;
            $scope.bldFilter = null;

            getData('events');
            getData('screenshots');
            getData('buildings');
            getData('players');
            countItems();
        };

        // Read all JSON data files and when it's done, get all data from DB
        Data.categories.forEach(function(category){
            getJSON(category);
        });
    }
    ]);

app.filter('processImg',function(){
    return function(img){
        return img.split(",")[1];
    }
});

function prefix(txt,time,name){
    var t = new Date(time);
    var dateStr = "["+t.getDate()+"/"+(t.getMonth()+1)+" "+t.getHours()+":"+("0"+t.getMinutes()).slice(-2)+":"+("0"+t.getSeconds()).slice(-2)+"]"; // Slice: to ensure 0 padding
    var tokens = [dateStr,txt];
    if(name) tokens.splice(1,0,'['+name+']');
    return tokens.join(" ");
}

app.filter('buildingName',function(){
    return function(id){
        console.log(id);
        return Data.buildingsData[id].name
    }
});

app.filter('itemName',function(){
    return function(id){
        return Data.itemsData[id].name
    }
});

app.filter('eventFilter',function(){
    return function(event){
        switch(event.action){
            case 'battle':
                return prefix("Started a battle against "+event.category+" "+Data.animalsData[event.type].name,event.time,event.pname);
            case 'building':
                return prefix("Entered building "+Data.buildingsData[event.building].name,event.time,event.pname);
            case 'buy':
                var verb = event.price ? 'Bought' : 'Took';
                var txt = verb+" "+event.nb+ " "+Data.itemsData[event.item].name;
                if(event.price) txt += " for "+(event.price*event.nb);
                return prefix(txt,event.time,event.pname);
            case 'chat':
                return prefix("Said: \""+event.txt+"\"", event.time,event.pname);
            case 'connect':
                return prefix("Connected in settlement "+event.stl, event.time,event.pname);
            case 'craft':
                return prefix("Crafted "+event.nb+ " "+Data.itemsData[event.item].name, event.time,event.pname);
            case 'disconnect':
                return prefix("Disconnected", event.time,event.pname);
            case 'explore':
                return prefix("Explored AOI "+event.aoi, event.time,event.pname);
            case 'gold':
                var verb = event.amount > 0 ? 'Gave' : 'Took';
                return prefix(verb+" "+event.amount+" gold", event.time,event.pname);
            case 'loot':
                return prefix("Looted "+event.name, event.time,event.pname);
            case 'menu':
                return prefix("Opened "+event.menu+" menu", event.time,event.pname);
            case 'newbuilding':
                return prefix("Built "+Data.buildingsData[event.building].name+" at "+event.x+", "+event.y,event.time,event.pname);
            case 'pickup':
                return prefix("Picked up "+Data.itemsData[event.item].name,event.time,event.pname);
            case 'respawn':
                return prefix("Respawned", event.time,event.pname);
            case 'sell':
                var verb = event.price ? 'Sold' : 'Gave';
                var txt = verb+" "+event.nb+ " "+Data.itemsData[event.item].name;
                if(event.price) txt += " for "+(event.price*event.nb);
                return prefix(txt,event.time,event.pname);
            case 'server-start':
                return prefix(" SERVER RESTART",event.time);
            case 'tutorial-end':
                return prefix('-- A player finished the tutorial --',event.time);
            case 'tutorial-start':
                return prefix('-- A player started the tutorial --',event.time);
            case 'use':
                return prefix("Used "+Data.itemsData[event.item].name,event.time,event.pname);
            default:
                return 'Undefined event';
        }
    }
});
