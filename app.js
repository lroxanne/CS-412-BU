const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ps4Router = require('./ps4');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/ps4', ps4Router);

// Route to render the form on the homepage
app.get('/', (req, res) => {
  res.render('form');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

