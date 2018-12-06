/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 06-12-18.
 */
var expect = require('chai').expect;
var request = require('request');

describe('Server', function () {
    it('Should run', function (done) {

        // TODO: use env vars
        request('http://localhost:8081' , function(error, response, body) {
            console.log(body);
            console.log(error);
            //expect(body).to.equal('Hello World');
            expect(response.statusCode).to.equal(200);
            done();
        });

        // 1. ARRANGE
        /*var x = 5;
        var y = 1;
        var sum1 = x + y;

        // 2. ACT
        var sum2 = x+y;

        // 3. ASSERT
        expect(sum2).to.be.equal(sum1);*/

    });
});