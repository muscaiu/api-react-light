const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3001;
const app = express();
const router = express.Router();
const fs = require('fs');
const Gpio = require('onoff').Gpio;
const relay = new Gpio(17, 'out');
const axios = require('axios');
const { format } = require('date-fns');
const pack = require('../package.json')

const firebase = require("firebase");
const config = require('./config');
firebase.initializeApp(config);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const actionsRef = firebase.database().ref('actions');
let lastAction = 'uninitialized';
let mode = 'auto';
let modeTime = 'uninitialized';
let lastWeatherUpdate = 'uninitialized';

// const API_KEY = 'TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix';
const ACU_API = 'http://dataservice.accuweather.com/currentconditions/v1';
const CITY_KEY = '273756';

function watherCron() {
  axios.get(`${ACU_API}/${CITY_KEY}?apikey=TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix`)
    .then(response => {
      lastWeatherUpdate = response.data[0]
    })
    .catch((error) => {
      console.log(error);
    })
}
watherCron();
setInterval(watherCron, 60 * 120000); //every 2 hours


actionsRef.limitToLast(1).on('child_added', function (snap) {
  lastAction = snap.val().lastAction;
  mode = snap.val().mode;
  lastStatus = snap.val().status;

  if (lastStatus) {
    relay.writeSync(0); //turn relay on
  } else {
    relay.writeSync(1); //turn relay off
  }
  console.log('relay true status', relay.readSync() === 1 ? 'OFF' : 'ON');
})

function checkBetweenHours(first, second) {
  const date = new Date();
  // let current_minute = date.getMinutes();
  let currentHour = date.getHours();
  let currentValue = relay.readSync();
  lastAction = Date.now();

  console.log(currentHour, first, second, mode);
  if (currentHour >= first && currentHour <= second) {
    if (currentValue === 1) {
      actionsRef.push({
        lastAction,
        status: currentValue,
        mode,
        humanDate: format(lastAction, 'HH:mm DD/MMM'),
        lastWeatherUpdate
      });

      relay.writeSync(0); //turn relay on
      console.log('relay was off, turning it on')
    } else {
      console.log('relay is on already')
    }
  } else {
    if (currentValue === 0) {
      actionsRef.push({
        lastAction,
        status: currentValue,
        mode,
        humanDate: format(lastAction, 'HH:mm DD/MMM'),
        lastWeatherUpdate
      });

      relay.writeSync(1); //turn relay off
      console.log('relay was on, turning it off')
    } else {
      console.log('relay is off already')
    }
  }
}

function timeCron() {
  if (mode === 'auto') {
    checkBetweenHours(19, 20)
  }
}
// timeCron();
setInterval(timeCron, 600000); //every 10 minutes
// setInterval(timeCron, 10000); //every 10 sec


router.get('/light', function (req, res) {
  let currentValue = relay.readSync();
  res.json(
    {
      status: currentValue,
      lastAction,
      mode,
      lastWeatherUpdate,
      apiVersion: pack.version
    }
  );
});

router.post('/light', function (req, res) {
  console.log('change status to', req.body.status)
  lastAction = Date.now();

  actionsRef.push({
    lastAction,
    status: req.body.status,
    mode,
    humanDate: format(lastAction, 'HH:mm DD/MMM'),
    lastWeatherUpdate
  });

  if (req.body.status === true) {
    relay.writeSync(0); //turn relay on
  } else {
    relay.writeSync(1); //turn relay off
  }
  res.json(
    {
      status: 'light changed!',
      lastAction
    }
  );
});

router.post('/login', function (req, res) {
  if (req.body.password === 'orhideelor') {
    lastAction = Date.now();
    console.log(req.body, 'access granted')
    res.json({ access: true, lastAction })
  } else {
    console.log(req.body, 'access denied')
    res.json({ access: false })
  }
});

router.post('/mode', function (req, res) {
  if (req.body.password === 'orhideelor') {
    mode = req.body.mode;
    modeTime = Date.now();
    console.log(mode, 'access granted')
    res.json({ access: true, mode, modeTime })
  } else {
    console.log(req.body, 'access denied')
    res.json({ access: false })
  }
});


app.listen(port, function () {
  console.log(`API running on port ${port}`);
});

app.use('/api', router);

process.on('SIGINT', () => { //on ctrl+c
  relay.writeSync(0); // Turn relay off
  relay.unexport(); // Unexport relay GPIO to free resources
  process.exit(); //exit completely
}); 
