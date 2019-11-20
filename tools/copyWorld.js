/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-02-19.
 */
var https = require('https');

const options = {
    hostname: '157.230.119.111',
    port: 8081,
    path: '/admin/buildings',
    method: 'GET'
};

var req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
      console.log(d);
    })
});

req.on('error', error => {
    console.error(error);
});