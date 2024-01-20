var can = require('socketcan');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server);
const canPIDConfig = require('./config/canbusConfig');

// Config
const currentCar = 'honda';
const canChannel = 'vcan0';

var canbusData = {
  rpm: 0,
  speed: 0,
  gear: 0,
  voltage: 0,
  iat: 0,
  ect: 0,
  tps: 0,
  map: 0,
  inj: 0,
  ign: 0,
  lambdaRatio: 0,
  lambda: 0
}

/* -------------------- Data conversion -------------------- */
function dataConversion() {
  if (currentCar === 'honda') {
    canbusData.tps = canbusData.tps/2
  }

  if (currentCar === 'mazda') {
    //canbusData.tps = canbusData.tps / 2;
   // console.log('Conversion: ', canbusData.tps);
  }
};

/* -------------------- socketio setup -------------------- */
//#region Main
var channel = can.createRawChannel(canChannel, true);

app.use(express.static(__dirname + '/client'));

socketio.on('connection', function(client) {
  console.log('Client connected');
});

setInterval(() => {
  socketio.emit('CANBusMessage', canbusData);
}, 100);
//#endregion

/* -------------------- Data acquisition -------------------- */
channel.addListener('onMessage', function(msg) {
  var currentConfig = canPIDConfig[currentCar];

   for (var param in currentConfig) {
     var config = currentConfig[param];

     if (config.ids.includes(msg.id))
       canbusData[param] = msg.data.readUIntBE(config.offset, config.size)
   }

   dataConversion();    
});

/*
channel.addListener('onMessage', function(msg) {
  // Rpm, speed, gear, voltage
  if (msg.id === 660 || msg.id === 1632) {
    canbusData.rpm = msg.data.readUIntBE(0, 2);
    canbusData.speed = msg.data.readUIntBE(2, 2);
    canbusData.gear = msg.data.readUIntBE(4, 1);
    canbusData.voltage = msg.data.readUIntBE(5, 1);
  }
  
  // Temperates - IAT, ECT
  if (msg.id === 661 || msg.id === 1633) {
    canbusData.iat = msg.data.readUIntBE(0, 2);
    canbusData.ect = msg.data.readUIntBE(2, 2);
  }
  
  // TPS, MAP
  if (msg.id === 662 || msg.id === 1634) {
    canbusData.tps = msg.data.readUIntBE(0, 2);
    canbusData.map = msg.data.readUIntBE(2, 2);
  if (canbusData.tps === 65535)
    canbusData.tps = 0
 }

  // Injector duration, Ignition advance
  if (msg.id === 663 || msg.id === 1635) {
    canbusData.inj = msg.data.readUIntBE(0, 2);
    canbusData.ign = msg.data.readUIntBE(2, 2);
  }

  // Lambda Ratio, Lambda
  if (msg.id === 664 || msg.id === 1636) {
    canbusData.lambdaRatio = msg.data.readUIntBE(0, 2);
    canbusData.lambda = msg.data.readUIntBE(2, 2);
  }

  console.log(canbusData);
});
*/

channel.start();
server.listen(3000);
