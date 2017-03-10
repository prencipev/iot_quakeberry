var awsIot = require('aws-iot-device-sdk');
const os = require('os');
var network = require('network');
var geoip = require('geoip-lite');
var AWS = require('aws-sdk');
var shadow = require('./shadow');
var geolib = require('geolib');


//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourAWSRegion>'
// with a unique client identifier and the AWS region you created your
// certificate in (e.g. 'us-east-1').  NOTE: client identifiers must be
// unique within your AWS account; if a client attempts to connect with a
// client identifier which is already in use, the existing connection will
// be terminated.
//
function start() {
    var params = {
        keyPath: "RPi1.private.key",
        certPath: "RPi1.cert.pem",
        caPath: "root-CA.crt",
        clientId: "RPi1",
        region: "eu-west-1"
    };


    var thingCommunicator = awsIot.thingShadow(params);
    shadow(thingCommunicator).then(data => {
            console.log('connect');
            thingCommunicator.publish('shadow/topic', JSON.stringify(data));
            //thingCommunicator.publish('simulator/topic', JSON.stringify(data));
            thingCommunicator.subscribe('analyzer/topic');
        })
        .catch(err => {
            console.log(err);
        });

    thingCommunicator.on('message', function(topic, payload) {
        var eq = JSON.parse(payload);
        var evLoc = { latitude: eq.geometry.coordinates[0], longitude: eq.geometry.coordinates[1] };
        var devLoc = { latitude: process.env.LAT, longitude: process.env.LON };
        var distance = geolib.getDistance(evLoc, devLoc);
        console.log('distance in meters', distance);
        console.log('distance in Km', parseInt(distance) / 1000);
        console.log('message', topic, payload.toString());
    });
}

module.exports = start;


start();