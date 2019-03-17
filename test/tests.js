/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 06-12-18.
 */
var expect = require('chai').expect;
var request = require('request');
var io = require('socket.io-client');
var path = require('path');
var sinon = require('sinon');
var mongoose = require('mongoose');

var mapsDir = path.join(__dirname,'..','maps');
var gs = require('../server/GameServer.js').GameServer;

var PORT = 8081; //TODO: read from conf file?

describe('test', function(){
    /*The stub essentially suppresses the call to a method, while allowing to check if it was called
    * and with what arguments. It doesn't provide a mock return value!*/
    it('stub-test',function() {
        var methodB = sinon.stub(gs, 'testMethodB');
        var input = 5;
        var output = gs.testMethodA(input);
        expect(output).to.equal(input);
        methodB.restore();
        sinon.assert.calledWith(methodB, input);
    });

    /*it('mock-test',function() {

    });*/
});

describe('GameServer',function(){
    var stubs = [];
    before(function(done) {
        this.timeout(3000);
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/westward');
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
            console.log('Connection to db established');
            // TODO: read from config
            gs.readMap(mapsDir,false,done); 
            gs.server = {
                sendError: function(){}
            };
        });
    });

    var player;
    it('addNewPlayer',function(){
        var errInputs = [{},{new:true}];
        errInputs.forEach(function(input){
            var result = gs.addNewPlayer(null,input);
            expect(result).to.equal(null);
        });

        var name = 'Test';
        player = gs.addNewPlayer(null,{characterName:name});
        expect(player.name).to.equal(name);
    });

    var animal;
    it('addAnimal', function(){
        var x = 0;
        var y = 0;
        var type = 0;
        animal = gs.addAnimal(x,y,type);
        expect(animal.x).to.equal(x);
        expect(animal.y).to.equal(y);
        expect(animal.type).to.equal(type);
    });

    it('handleBattle',function(){
        var result = gs.handleBattle(player,animal);
        expect(result).to.equal(true);
    });

    it('animalDie',function(){
       animal.die();
        expect(animal.idle).to.equal(false);
        expect(animal.dead).to.equal(true);
    });

    it('lootNPC',function(){
        var result = gs.lootNPC(player,'animal',animal.id);
        expect(result).to.equal(true);
    });

    afterEach(function(){
        stubs.forEach(function(stub){
            stub.restore();
        })
    });
});

/*
describe('Server', function () {
    return;
    /!*var client;
    before('socket-client',function(){
        client = io('http://localhost:'+PORT); // https://github.com/agconti/socket.io.tests/blob/master/test/test.js
    });*!/

    it('Run', function (done) {
        request('http://localhost:'+PORT, function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    var client;
    it('io-connection',function(done){
        client = io('http://localhost:'+PORT); // https://github.com/agconti/socket.io.tests/blob/master/test/test.js
        client.on('ack',function(){
            expect(true).to.equal(true);
            done();
        });
    });

    it('io-init-world-errs',function(done) {
        var errInputs = [{},{new:true}];
        var nbEvts = 0;
        var nbErrs = 0;
        var onevent = client.onevent;
        client.onevent = function (packet) {
            nbEvts++;
            if (packet.data[0] == 'serv-error') nbErrs++;
            if (nbEvts == errInputs.length) {
                expect(nbErrs).to.equal(nbEvts);
                done();
            }
            //onevent.call(this, packet);    // original call
        };
        errInputs.forEach(function(input){
            client.emit('init-world',input);
        });
    });
});*/
