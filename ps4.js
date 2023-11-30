const express = require('express');
const router = express.Router();
const request = require('request');
const fetch = require('node-fetch');
const redis = require('redis');
const API_KEY = '82bc82dc15711dd751f33383a2188a43';

// Set up Redis client
const redisClient = redis.createClient({ legacyMode: true, url: 'redis://127.0.0.1:6379' });
redisClient.connect().catch(console.error);

// Route using Promise
// ... other imports and setup ...

router.post('/weather-promise', async (req, res) => {
  const city = req.body.city;
  const cacheKey = `weather:${city}`;
  const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({ weather: JSON.parse(cachedData), source: 'cache' });
    }

    new Promise((resolve, reject) => {
      request(API, (error, response, body) => {
        if (error) reject(error);
        resolve(body);
      });
    })
    .then(data => {
      if (!data) throw new Error('API returned empty data');
      const parsedData = JSON.parse(data);
  
      console.log('Caching data for:', cacheKey, parsedData); // Log data before caching
  
      // Wrapping the Redis set operation in a Promise
      new Promise((resolve, reject) => {
        redisClient.set(cacheKey, JSON.stringify(parsedData), 'EX', 15, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      })
      .then(() => {
        res.json({ weather: parsedData, source: 'api' });
      })
      .catch(err => {
        console.error('Redis set error:', err);
        // Send response even if caching fails
        res.json({ weather: parsedData, source: 'api' });
      });
    })
    .catch(error => {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});





// Route using async/await
router.post('/weather-async', async (req, res) => {
  const city = req.body.city;
  const cacheKey = `weather:${city}`;
  const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({ weather: JSON.parse(cachedData), source: 'cache' });
    }

    const response = await fetch(API);
    const data = await response.json();
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 15 });

    res.json({ weather: data, source: 'api' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Route using callback
router.post('/weather-callback', (req, res) => {
  const city = req.body.city;
  const cacheKey = `weather:${city}`;
  const API = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`;

  redisClient.get(cacheKey, (err, cachedData) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error', details: err.message });

    if (cachedData) {
      return res.json({ weather: JSON.parse(cachedData), source: 'cache' });
    }

    request(API, (error, response, body) => {
      if (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
      } else {
        try {
          const data = JSON.parse(body);
          redisClient.set(cacheKey, body, { EX: 15 });
          res.json({ weather: data, source: 'api' });
        } catch (parseError) {
          res.status(500).json({ error: 'Internal Server Error', details: parseError.message });
        }
      }
    });
  });
});

module.exports = router;
