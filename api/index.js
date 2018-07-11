const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3001;
const app = express();
const router = express.Router();
const fs = require('fs');
const Gpio = require('onoff').Gpio;
const relay = new Gpio(17, 'out');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
relay.writeSync(1); //turn relay off on start for safety

let lastAction = 'uninitialized'

router.get('/light', function (req, res) {
  let currentValue = relay.readSync();
  res.json(
    {
      status: currentValue,
      lastAction
    }
  );
});

router.post('/light', function (req, res) {
  console.log('change status to', req.body.status)
  lastAction = Date.now();

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
