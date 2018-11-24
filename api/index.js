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
const firebase = require("firebase");
const { format } = require('date-fns');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const config = {
  apiKey: "AIzaSyDu1V6eO6vQczNtecZdo8rVvFQAZB6llyg",
  authDomain: "pompa-b855f.firebaseapp.com",
  databaseURL: "https://pompa-b855f.firebaseio.com",
  projectId: "pompa-b855f",
  storageBucket: "pompa-b855f.appspot.com",
  messagingSenderId: "145084180701"
};
firebase.initializeApp(config);

const actionsRef = firebase.database().ref('actions');
let lastAction = 'uninitialized';
let lastWeatherUpdate = 'uninitialized';

const API_KEY = 'TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix';
const ACU_API = 'http://dataservice.accuweather.com/currentconditions/v1';
const CITY_KEY = '273756';

function intervalFunc() {
  axios.get(`${ACU_API}/${CITY_KEY}?apikey=TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix`)
    .then(response => {
      lastWeatherUpdate = response.data[0]
    })
    .catch((error) => {
      console.log(error);
    })
}
intervalFunc();
setInterval(intervalFunc, 60 * 120000); //every 2 hours

actionsRef.limitToLast(1).on('child_added', function (snap) {
  lastAction = snap.val().lastAction;
  lastStatus = snap.val().status;
  if (lastStatus) {
    relay.writeSync(0); //turn relay on
  }else{
    relay.writeSync(1); //turn relay off
  }
  console.log('relay true status', relay.readSync() === 1 ? 'OFF' : 'ON');
})

router.get('/light', function (req, res) {
  let currentValue = relay.readSync();
  res.json(
    {
      status: currentValue,
      lastAction,
      lastWeatherUpdate
    }
  );
});

router.post('/light', function (req, res) {
  console.log('change status to', req.body.status)

  lastAction = Date.now();

  actionsRef.push({
    lastAction,
    status: req.body.status,
    type: 'manual',
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


app.listen(port, function () {
  console.log(`API running on port ${port}`);
});

app.use('/api', router);

process.on('SIGINT', () => { //on ctrl+c
  relay.writeSync(0); // Turn relay off
  relay.unexport(); // Unexport relay GPIO to free resources
  process.exit(); //exit completely
}); 
