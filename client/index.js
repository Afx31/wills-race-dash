var socket = io.connect('localhost:3000');

socket.on('CANBusMessage', (data) => {  
  // if (data.changeDisplay === 1)
  //   window.location.href = 'http://localhost:3000/LapTimingDisplay';

  var rpmBar = document.getElementById('rpmbar');
  var rpmNum = document.getElementById('rpmNum');
  var speed = document.getElementById('speed');
  var gear = document.getElementById('gear');
  var voltage = document.getElementById('voltage');
  var iat = document.getElementById('iat');
  var ect = document.getElementById('ect');
  var tpsBar = document.getElementById('tpsbar');
  var tps = document.getElementById('tps');
  var map = document.getElementById('map');
  var lambdaRatio = document.getElementById('lambdaRatio');
  // var inj = document.getElementById('inj');
  // var ign = document.getElementById('ign');
  var oilTemp = document.getElementById('oilTemp');
  var oilPressure = document.getElementById('oilPressure');

  // RPM progressive bar
  // OLD
  // rpmBar.style.setProperty('max-width', '1920px', 'important'); //1582px
  // var rpmbarPercentage = (data.rpm / 9000) * 100; // = (currentRpm/redlineRpm) * 100
  // rpmBar.style.width = `${rpmbarPercentage}%`;
  // NEW
  rpmBar.style.width = ((data.rpm / 9000) * 100) + '%';

  // TPS progressive bar - MOVED THIS TO CSS
  // tpsBar.style.setProperty('max-height', '400px', 'important');

  // Assign data to UI controls
  tpsBar.style.height = data.tps + '%';
  rpmNum.textContent = data.rpm;
  speed.textContent = data.speed;
  gear.textContent = data.gear;
  
  // voltage.textContent = (data.voltage / 10).toFixed(1); //TODO: This needs to be moved to backend
  voltage.textContent = data.voltage;
  
  iat.textContent = data.iat;
  ect.textContent = data.ect;
  tps.textContent = data.tps;
    
  // map.textContent = (data.map / 10) / 2;
  map.textContent = data.map;
  
  // lambdaRatio.textContent = (32768 / data.lambdaRatio).toFixed(2); //TODO: This needs to be moved to backend
  lambdaRatio.textContent = data.lambdaRatio;

  // inj.textContent = data.inj;
  // ign.textContent = data.ign;
  oilTemp.textContent = data.oilTemp;
  oilPressure.textContent = data.oilPressure;

  // RPM Bar colouring
  // var percentInt = parseInt(rpmBar.style.width);
  // if (percentInt > 85)
  //   rpmBar.style.setProperty('background-color', 'red', 'important');
  // else if (percentInt > 60)
  //   rpmBar.style.setProperty('background-color', 'yellow', 'important');
  // else
  //   rpmBar.style.setProperty('background-color', 'green', 'important');
});