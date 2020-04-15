const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const assistanceSchema = new mongoose.Schema({
  name: String,
  phone: String,
  category: String,
  itemRequested: String,
  date: { type: Date, default: Date.now },
  isActioned: { type: Boolean, default: false },
});

const assistance = mongoose.model('assistance', assistanceSchema);

// define the https post for storing assistance request
router.post('/', async function (req, res) {
  let db = req.app.locals.database;
  let collection = db.collection('assistance');
  let myData = new assistance(req.body);
  await collection.insertOne(myData);
  res.send(myData);
});

module.exports = router;
