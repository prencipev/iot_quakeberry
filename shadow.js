'use strict';

var awsIot = require('aws-iot-device-sdk');
const os = require('os');
var network = require('network');
var geoip = require('geoip-lite');
var AWS = require('aws-sdk');


function start(thingShadows) {

    return new Promise((resolve, reject) => {
        var params = {
            keyPath: "RPi1.private.key",
            certPath: "RPi1.cert.pem",
            caPath: "root-CA.crt",
            clientId: "RPi1",
            region: "eu-west-1"
        };


        const thingArn = "arn:aws:iot:eu-west-1:511386292871:thing/RPi1";
        const thingIotEndpoint = "https://ak8by74ifg9ks.iot.eu-west-1.amazonaws.com";
        const thingConenctor = { thingArn: thingArn, thingIotEndpoint: thingIotEndpoint };

        var clientTokenUpdate;

        thingShadows.on('connect', function() {
            console.log("connected")
            network.get_public_ip(function(err, ip) {
                if (!err)
                    var ip_x = ip;

                var geo = geoip.lookup(ip_x);
                var locationState = geo;
                process.env.LAT = locationState.ll[0];
                process.env.LON = locationState.ll[1];
                var deviceState = {
                    "state": {
                        "desired": {
                            "active": true
                        },
                        "reported": {
                            "active": true
                        }
                    }
                }

                thingShadows.register('RPi1', {
                        ignoreDeltas: true
                    },
                    function(err, failedTopics) {
                        if (typeof(err) === "undefined" && typeof(failedTopics) === "undefined") {
                            console.log('Device thing registered.');
                            clientTokenUpdate = thingShadows.update('RPi1', deviceState);
                            Object.assign(locationState, deviceState, thingConenctor);
                            console.log(locationState);
                            resolve(locationState);
                            if (clientTokenUpdate === null) {
                                reject({ err: "update shadow failed, operation still in progress" })
                            }
                        } else {
                            reject(err, failedTopics);
                        }
                    });
            })
        });

        thingShadows.on('status',
            function(thingName, stat, clientToken, stateObject) {
                console.log('received ' + stat + ' on ' + thingName + ': ' +
                    JSON.stringify(stateObject));
                resolve(stateObject);
            });

        thingShadows.on('delta',
            function(thingName, stateObject) {
                console.log('received delta on ' + thingName + ': ' +
                    JSON.stringify(stateObject));
                resolve(stateObject);
            });

        thingShadows.on('timeout',
            function(thingName, clientToken) {
                console.log('received timeout on ' + thingName +
                    ' with token: ' + clientToken);
                reject('received timeout on ' + thingName +
                    ' with token: ' + clientToken)
            });
    });
}

module.exports = start;