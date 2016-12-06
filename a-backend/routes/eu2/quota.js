var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com')


client.on('connect', function () {
  client.subscribe(`eu-quotaPut-`+global.mqttId)
})

client.on('message', function (topic, message) {
  // message is Buffer 
  if(topic==`eu-quotaPut-`+global.mqttId){
      console.log(message.toString())
      console.log('ok');
  }
  client.end()
  
})

module.exports = router;

