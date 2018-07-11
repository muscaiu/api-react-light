const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3001;
const app = express();
const router = express.Router();
const fs = require('fs');
//PI imports
const Gpio = require('onoff').Gpio;
const relay = new Gpio(17, 'out');

let lastAction = 'neinitializat'

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

router.get('/light', function (req, res) {
  let currentValue = relay.readSync();
  res.json(
    {
      status: currentValue,
      lastAction
    }
  );
});

relay.writeSync(1); //turn relay off on start

router.post('/light', function (req, res) {
  console.log('data', req.body)
  lastAction = Date.now();

  if (req.body.status === true) {
    relay.writeSync(1); //turn relay on
  } else {
    relay.writeSync(0); //turn relay off
  }
  res.json(
    {
      status: 'light changed!',
      lastAction
    }
  );
});

// io.sockets.on('connection', (socket) => {// WebSocket Connection
//   let currentValue = relay.readSync();
//   console.log('+ connection, currentValue is', currentValue)

//   socket.emit('light', currentValue)

//   socket.on('light', (data) => { //get light switch status from client
//     console.log('currentValue',currentValue)
//     console.log('data', data)
//     if (data != relay.readSync()) { //only change relay if status has changed
//         relay.writeSync(data); //turn relay on or off
//     }
//   });
// });


app.listen(port, function () {
  console.log(`API running on port ${port}`);
});

app.use('/api', router);

process.on('SIGINT', () => { //on ctrl+c
  relay.writeSync(0); // Turn relay off
  relay.unexport(); // Unexport relay GPIO to free resources
  process.exit(); //exit completely
}); 
