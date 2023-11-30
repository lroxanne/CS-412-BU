const express = require('express');
const router = express.Router();
const request = require('request');
const fetch = require('node-fetch');
const API_KEY = process.env.WEATHER_API_KEY; // Ensure you have this in your .env file
//A route on a POST method that retrieves data from an external API
router.post('/weather-promise', (req, res) => {
  const city = req.body.city;
  const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;

  new Promise((resolve, reject) => {
    request(API, (error, response, body) => {
      if (error) reject(error);
      resolve(body);
    });
  })
  .then(data => {
    res.render('results', { weather: JSON.parse(data) });
  })
  .catch(error => {
    res.status(500).render('error', { error });
  });
});
//A second route, similar to the one in b. that uses async/await syntax rather than Promises
router.post('/weather-async', async (req, res) => {
  const city = req.body.city;
  const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;

  try {
    const response = await fetch(API);
    const data = await response.json();
    res.render('results', { weather: data });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});
//A third route, similar to b. and c., that uses a callback to handle the async API call. 
//For this one, use the 'request' package. It's fine to hit the same endpoint
router.post('/weather-callback', (req, res) => {
    const city = req.body.city;
    const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;
     
  
    request(API, (error, response, body) => {
      if (error) {
        res.status(500).render('error', { error });
      } else {
        try {
          const data = JSON.parse(body);
          res.render('results', { weather: data });
        } catch (parseError) {
          res.status(500).render('error', { error: parseError });
        }
      }
    });
});

  

module.exports = router;
