const fs = require('fs');
var can = require('socketcan');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server);
const path = require('path');
const { CanData, CanPIDConfig } = require('./config/canConfig');
const { TrackStartFinishLines, GPSData, LapTiming } = require('./config/lapTimingConfig');
// const { GetGPSLocation } = require('./gps/gps');
// const { GetGPSLocation } = require('./gps/gps');

// Config
const serverConfig = {
  canChannel: 'can0',
  currentCar: 'honda',
  currentTrack: 'home',
  lapTiming: false,
  dataLogging: false
};

// var tempLoggedData = {
//   rpm: 0,
//   speed: 0,
//   gear: 0,
//   voltage: 0,
//   iat: 0,
//   ect: 0,
//   tps: 0,
//   map: 0,
//   inj: 0,
//   ign: 0,
//   lambdaRatio: 0,
//   lambda: 0,
//   oilTemp: 0,
//   oilPressure: 0
// }

/* -------------------- Express redirect endpoint setup -------------------- */
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'index.html'));
// });

// app.get('/DataLoggingDisplay', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'DataLoggingDisplay', 'index.html'));
// });

// app.get('/LapTimingDisplay', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'LapTimingDisplay', 'index.html'));
// });

// app.use(express.static('client'));

/* -------------------- Socket setup -------------------- */
//#region
var channel = can.createRawChannel(serverConfig.canChannel, true);

app.use(express.static(__dirname + '/client'));

socketio.on('connection', function(client) {
  console.log('Client connected');
});

setInterval(() => {
  socketio.emit('CANBusMessage', CanData);
}, 100);

// if (serverConfig.lapTiming) {
//   setInterval(() => {
//     LapTiming.updateCurrentLap();
//     socketio.emit('LapTiming', LapTiming.currentLap);
//   }, 100);

//   setInterval(() => {
//     socketio.emit('LapStats', LapTiming.lastLap, LapTiming.bestLap, LapTiming.pbLap);
//   }, 10000);
// }

// if (serverConfig.dataLogging) {
//   setInterval(() => {
//     socketio.emit('DataLogging', tempLoggedData);
//   }, 5000);
// }
//#endregion

/* -------------------- Lap Timing -------------------- */
if (serverConfig.lapTiming) {
  //GetGPSLocation();
  LapTiming.startLap();

  /*
    - Very rough idea on how the comparison would work. Would need to put it into it's own class with a bunch of logic around the matching
    - I think we could have a field for each track where we know the 'quickest' possible lap time.
      - Don't do the GPS location check until we've gone past that quickest lap. i.e. 58 seconds @ Wakefield
  */

  setInterval(() => {
    if (GPSData.lat === TrackStartFinishLines.home.lat && GPSData.lon === TrackStartFinishLines.home.lon) {
      LapTiming.finishLap();
      LapTiming.startLap();
      // Would we need to do LapTiming.updateCurrentLap() again instead of L31 ?
    }
  }, 100);
}

/* -------------------- Data conversion -------------------- */
// var prevOilPressure;
// var prevOilTemp;
function DataConversion(msgId) {
  if (serverConfig.currentCar === 'honda') {
    if (CanData.tps === 65535) {
      CanData.tps = 0
    }
    else if (msgId === 667 || msgId === 1639) {
      // try the below IF first  
      // Oil Temperature
      // if (prevOilTemp !== CanData.oilTemp)
      {
        var A = 0.0014222095, B = 0.00023729017, C = 9.3273998E-8;
        var oilTempResistance = CanData.oilTemp;

        var kelvinTemp = 1 / (A + B * Math.log(oilTempResistance) + C * Math.pow(Math.log(oilTempResistance), 3));
        var celsiusTemp = kelvinTemp - 273.15;
        CanData.oilTemp = celsiusTemp.toFixed(2);
        // prevOilTemp = celsiusTemp.toFixed(2);
      }

      // Oil Pressure
      // if (prevOilPressure !== CanData.oilPressure)
      {
        var oilPressureResistance = CanData.oilPressure / 819.2; // Specified by Hondata | convert from 'raw voltage' value
        // Below values are all specified by Bosch for this combination oil temp/pressure sensor
        var originalLow = 0; //0.5;
        var originalHigh = 5; //4.5;
        var desiredLow = -100; //0;
        var desiredHigh = 1100; //1000;

        // Calculate the ratio of the original value's position within the original range
        var ratio = (oilPressureResistance - originalLow) / (originalHigh - originalLow);
        // Use this ratio to find the equivalent position within the desired range
        var kPaValue = (ratio * (desiredHigh - desiredLow)) + desiredLow;
        CanData.oilPressure = (kPaValue * 0.145038).toFixed(2); // Convert to psi
        // prevOilPressure = (kPaValue * 0.145038).toFixed(2); // Convert to psi
      }
    }
    else if (msgId === 660 || msgId === 1632) {
      CanData.voltage.toFixed(1);
    }
    else if (msgId === 662 || msgId === 1634) {
      CanData.map = (CanData.map / 10) / 2;
    }
    else if (msgId === 664 || msgId === 1636) {
      CanData.lambdaRatio = (32768 / CanData.lambdaRatio).toFixed(2);
    }
  }

  // if (serverConfig.currentCar === 'mazda') {
  //   CanData.tps = CanData.tps / 2;
  // }
};

/* -------------------- Data logging -------------------- */
function DataLogging() {
  // Reads in the data logging memory file
  // fs.readFile('data/datalog.json', 'utf8', (err, data) => {
  //   if (err) {
  //     console.error('Error reading the file:', err);
  //     return;
  //   }
  
  //   try {
  //     const jsonData = JSON.parse(data);
  //     console.log('JSON: ', jsonData);
  //   } catch (parseError) {
  //     console.error('Error parsing JSON:', parseError);
  //   }
  // });

  if (serverConfig.dataLogging) {
    for (var prop in CanData)
      if (CanData[prop] > tempLoggedData[prop])
        tempLoggedData[prop] = CanData[prop];

    dataString = JSON.stringify(tempLoggedData);
   // } else { // TODO: ONLY commented out to test read/write without the external button 
    fs.writeFile('data/datalog.json', dataString, (err) => {
      if (err)
        console.error('Error writing to file:', err);
    });
  }
}

/* ------------------ Data acquisition ------------------ */
channel.addListener('onMessage', function(msg) {
  switch(msg.id) {
    case 660:
    case 1632:
      CanData.rpm = msg.data.readUIntBE(0, 2);
      CanData.speed = msg.data.readUIntBE(2, 2);
      CanData.gear = msg.data.readUIntBE(4, 1);
      CanData.voltage = msg.data.readUIntBE(5, 1);
      break;
    case 661:
    case 1633:
      CanData.iat = msg.data.readUIntBE(0, 2);
      CanData.ect = msg.data.readUIntBE(2, 2);
      break;
    case 662:
    case 1634:
      CanData.tps = msg.data.readUIntBE(0, 2);
      CanData.map = msg.data.readUIntBE(2, 2);
      break;
    case 663:
    case 1635:
      CanData.inj = msg.data.readUIntBE(0, 2);
      CanData.ign = msg.data.readUIntBE(2, 2);
      break;
    case 664:
    case 1636:
      CanData.lambdaRatio = msg.data.readUIntBE(0, 2);
      CanData.lambda = msg.data.readUIntBE(2, 2);
      break;
    case 667:
    case 1639:
      CanData.oilTemp = msg.data.readUIntBE(0, 2);
      CanData.oilPressure = msg.data.readUIntBE(2, 2);
      break;
  }
  
  DataConversion(msg.id);

  // TODO: Commented out here to test ONLY writing to the file when clicking the 'stop datalogging button'
  if (serverConfig.dataLogging)
    DataLogging();

  // TESTING: If this is used, make sure to comment out the socket emit on L47
  // socketio.emit('CANBusMessage', CanData);
});

channel.start();
server.listen(3000);