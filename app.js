const express = require('express');
const app = express();

var assistance = require('./assistance');

app.use('/assistance', assistance);

app.listen(3000, () => console.log('Listening'));