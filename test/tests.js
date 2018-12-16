/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 06-12-18.
 */
var expect = require('chai').expect;
var request = require('request');
var io = require('socket.io-client');

var gs = require('../server/GameServer.js').GameServer;

var PORT = 8081; //TODO: read from conf file?

describe('Server', function () {

    /*var client;
    before('socket-client',function(){
        client = io('http://localhost:'+PORT); // https://github.com/agconti/socket.io.tests/blob/master/test/test.js
    });*/

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

    var inputs = [{},{new:true}];
    inputs.forEach(function(input,i){
        // Loop only the emits, declare receiving event only one, and use a counter or somesuch to make sure everything is error
        it('io-init-world-'+i,function(done){
            client.emit('init-world',input);
            client.on('serv-error',function(){
                expect(true).to.equal(true);
                done();
            })
        });
    });
});


// 1. ARRANGE
/*var x = 5;
var y = 1;
var sum1 = x + y;

// 2. ACT
var sum2 = x+y;

// 3. ASSERT
expect(sum2).to.be.equal(sum1);*/