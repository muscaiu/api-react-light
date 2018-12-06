// const axios = require('axios');

// const API_KEY = 'TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix';
// const ACU_API = 'http://dataservice.accuweather.com/currentconditions/v1';
// const CITY_KEY = '273756';

// function watherCron() {
//   axios.get(`${ACU_API}/${CITY_KEY}?apikey=TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix`)
//     .then(response => {
//       lastWeatherUpdate = response.data[0]
//     })
//     .catch((error) => {
//       console.log(error);
//     })
// }
// watherCron();
// setInterval(watherCron, 60 * 120000); //every 2 hours