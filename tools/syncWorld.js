/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */
let mongo = require('mongodb').MongoClient;
let mongoose = require('mongoose');

let Schemas = require('../server/schemas.js');

mongoose.connect(process.env.MONGODB_URI);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connection to db established');
    let BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
    BuildingModel.find(function (err, buildings) {
        if (err) return console.log(err);
        console.log(buildings);
    });
});