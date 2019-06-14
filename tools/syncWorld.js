/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */
let mongo = require('mongodb').MongoClient;
let mongoose = require('mongoose');

let Schemas = require('../server/schemas.js');


function fetch(){
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log('Connection to remote db established');
        let BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
        BuildingModel.find(function (err, buildings) {
            if (err) return console.log(err);
            console.log(buildings);
            mongoose.connection.close();
            insert(buildings);
        });
    });
}

function insert(buildings){
    mongoose.connect('mongodb://localhost:27017/westward',{ useNewUrlParser: true });
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log('Connection to local db established');
        let BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
        BuildingModel.remove({},function(err){
            if (err) return console.log(err);
            BuildingModel.collection.insert(buildings, function(err,docs){
                if (err) return console.log(err);
                console.log('Buildings synced!');
            })
        })
    });
}

fetch();
