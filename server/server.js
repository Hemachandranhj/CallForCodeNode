// import dependencies and initialize express
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const healthRoutes = require('./routes/health-route');
const swaggerRoutes = require('./routes/swagger-route');
const assistanceRoutes = require('./routes/assistance-route');

const config = require('./config/config.js');

const app = express();

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use('/health', healthRoutes);
app.use('/swagger', swaggerRoutes);
app.use('/assistance', assistanceRoutes);

// default path to serve up index.html (single page application)
app.all('', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '../public', 'index.html'));
});

// start node server
const port = process.env.PORT || global.gConfig.port;


// Open the connection and start the service
mongoose.connect
(global.gConfig.connnectionString,
 { useNewUrlParser: true }, function(err, database) {
    if (err) throw err;
    app.locals.database = database;
    // Start the application after the database connection is ready
    app.listen(port, () => {
      console.log(`App UI available http://localhost:${port}`);
      console.log(`Swagger UI available http://localhost:${port}/swagger/api-docs`);
  });
});

// error handler for unmatched routes or api calls
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public', '404.html'));
});

module.exports = app;
