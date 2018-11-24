const axios = require('axios');


const API_KEY = 'TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix';
const ACU_API = 'http://dataservice.accuweather.com/currentconditions/v1';
const CITY_KEY = '273756';

function intervalFunc() {
  axios.get(`${ACU_API}/${CITY_KEY}?apikey=TBvCyGYowHIVOtFjgGwL1jAyw6dPpUix`)
    .then(response => {
      console.log(response.data[0]);
      console.log(response.data[0]);
    })
    .catch((error) => {
      console.log(error);
    })
}

intervalFunc();

setInterval(intervalFunc, 60 * 60000); //every 60 minutes
