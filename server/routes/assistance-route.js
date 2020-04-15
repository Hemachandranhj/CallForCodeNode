var express = require('express');
var router = express.Router();

// define the https post for storing assistance request
router.post('/', function(req, res) {
  // TODO Call database and store the assistance request
  res.send({IsMessageReceived: true});
});

module.exports = router;
