/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 04-12-18.
 */

var app = angular.module('admin',[]);

var Data = {
    counter: 0,
    categories: ['buildings','items','animals']
};

function Session(id){
    this.id = id;
    this.events = [];
}

Session.prototype.add = function(evt){
    // console.log(evt.time, new Date(evt.time).getTime())
    evt.time = new Date(evt.time).getTime();
    this.events.push(evt);
    this.duration = (evt.time - this.events[0].time)/(60*1000);
    // console.log(this.duration)
}

function median(values){
    if(values.length ===0) return 0;
  
    values.sort(function(a,b){
      return a-b;
    });
  
    var half = Math.floor(values.length / 2);
  
    if (values.length % 2)
      return values[half];
  
    return (values[half - 1] + values[half]) / 2.0;
  }

app.controller("mainCtrl", [
    '$scope','$http',
    function($scope,$http) {

        getJSON = function(category){
            $http.get("/assets/data/"+category+".json").then(function(res) {
                if(res.status == 200){
                    Data[category+'Data'] = res.data;
                    Data.counter++;
                    // if(Data.counter == Data.categories.length) getAllData();
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

            //getData('events');
            getData('screenshots');
            //getData('buildings');
            //getData('players');
            //countItems();
        };

        // Read all JSON data files and when it's done, get all data from DB
        Data.categories.forEach(function(category){
            getJSON(category);
        });

        getEvents = function(category){
            $scope[category] = [];
            $http.get("/admin/events/").then(function(res) {
                if(res.status != 200) return;
                
                $scope['events'] = res.data;
                var sessions = {};
                var pids = new Set();
                var returning = new Set();
                for(var i = 0; i < res.data.length; i++){
                    var evt = res.data[i];
                    console.log(evt.session);
                    if(!evt.pid || !evt.session) continue;
                    if(!(evt.session in sessions)) sessions[evt.session] = new Session(evt.session);
                    sessions[evt.session].add(evt);
                    if(pids.has(evt.pid)) returning.add(evt.pid);
                    pids.add(evt.pid);
                }
                $scope['sessions'] = Object.values(sessions);

                var durations = $scope['sessions'].map(function(s){
                    return s.duration;
                });
                console.log(durations);

                var nbsessions = durations.length;
                var nbp = pids.size;
                $scope['median_duration'] = median(durations);
                $scope['ratio_returning'] = (returning.size/pids.size)*100;
                console.log('Number of sessions',nbsessions);
                console.log('Number of players',nbp);
                console.log('Ratio of returning players:', $scope['ratio_returning']);
                console.log('Median duration:', $scope['median_duration']);

            },function(err){});
        };

        getEvents();
        getData('screenshots');
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
                return prefix("Entered "+event.owner+"'s "+Data.buildingsData[event.building].name,event.time,event.pname);
            case 'buy':
                var verb = event.price ? 'Bought' : 'Took';
                var txt = verb+" "+event.nb+ " "+Data.itemsData[event.item].name;
                if(event.price) txt += " for "+(event.price*event.nb);
                return prefix(txt,event.time,event.pname);
            case 'chat':
                return prefix("Said: \""+event.txt+"\"", event.time,event.pname);
            case 'connect':
                return prefix("Connected in settlement "+event.stl+" ("+(event.re ? 'Returning' : 'New')+" player)", event.time,event.pname);
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
            case 'prices':
                return prefix("Set prices of "+Data.itemsData[event.item].name+" to "+event.buy+"/"+event.sell,event.time,event.pname);
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
                return prefix('-- A player finished the tutorial at step '+event.step+'--',event.time);
            case 'tutorial-start':
                return prefix('-- A player started the tutorial --',event.time);
            case 'use':
                return prefix("Used "+Data.itemsData[event.item].name,event.time,event.pname);
            default:
                return 'Undefined event';
        }
    }
});
