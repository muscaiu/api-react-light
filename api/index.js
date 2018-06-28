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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//CORS
app.use(cors());
// app.use(function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');

//   //and remove cacheing so we get the most recent comments
//   res.setHeader('Cache-Control', 'no-cache');
//   next();
// });

router.get('/light', function (req, res) {
  let currentValue = relay.readSync();
  res.json({ status: currentValue });
});

router.post('/light', function (req, res) {
  console.log('data', req.body)
  if (req.body.status === true) {
    relay.writeSync(1); //turn relay on or off
  }else{
    relay.writeSync(0); //turn relay on or off
  }
  res.json({ status: 'light changed!' });
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