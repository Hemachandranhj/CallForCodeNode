const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TwilioConnector = require('../integration/twilioconnector')


const assistanceSchema = new mongoose.Schema({
  name: String,
  phone: String, 
  itemRequested: String,
  address: String,
  date: { type: Date, default: Date.now },
  isActioned: { type: Boolean, default: false },
});

const assistance = mongoose.model('assistance', assistanceSchema);

// define the https post for storing assistance request
router.post('/', async function (req, res) {
  let db = req.app.locals.database;
  let collection = db.collection('assistance');
  const connector = new TwilioConnector();
  let messageText = await connector.getMessageBody(req.body.MessageSid);
  const textToRemove = 'Sent from your Twilio trial account - '
  messageText = messageText.replace(textToRemove, '');
  var messages = messageText.split('#');
  var errorMessage = validateMessage(messages);
  if(errorMessage === '')
  {  
    var assistanceData ={
      name: messages[1],
      phone: req.body.From,
      itemRequested: messages[0],
      address:messages[2]
    };
    let myData = new assistance(assistanceData);
    await collection.insertOne(myData);
    var message = "We have received your message.Will be in touch shortly"; 
    await connector.sendMessage(req.body.To,req.body.From,message);
    res.send(messageText);
  }
  else
  {
    await connector.sendMessage(req.body.To,req.body.From,errorMessage);
    res.send(errorMessage);
  }
 
});

function validateMessage(messages)
{
  let errorMessage = '';
 
  if(messages.length < 3)
  {
    errorMessage = 'Incorrect format.Please send in the format ItemsNeeded#Name#Address'
  } 

  return errorMessage;
}

module.exports = router;
