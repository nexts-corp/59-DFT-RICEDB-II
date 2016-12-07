var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com');

client.on('connect', function () {
  client.subscribe('testxx');
})

client.on('message', function (topic, message) {
  
  console.log(topic,message.toString());
  client.publish('testzz','123456');
  //setInterval(()=>{ client.publish('testzz','testzz'); }, 1000);
  //client.end();
  
})

module.exports = router;

