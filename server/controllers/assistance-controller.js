const mongoose = require('mongoose');
const TwilioConnector = require('../integration/twilioconnector')
const getIntents = require('../integration/watsonconnector');

const assistanceSchema = new mongoose.Schema({
    name: String,
    phone: String,
    itemRequested: String,
    address: String,
    tag: [String],
    date: { type: Date, default: Date.now },
    isActioned: { type: Boolean, default: false },
});

const assistance = mongoose.model('assistance', assistanceSchema);

function validateMessage(messages) {
    let errorMessage = '';

    if (messages.length < 3) {
        errorMessage = 'Incorrect format.Please send in the format ItemsNeeded#Name#Address'
    }

    return errorMessage;
}


// store assistance request
exports.storeAssistanceRequest = async (req, res) => {
    console.log('In controller - storeAssistanceRequest');
    if (req.body.MessageSid) {
        let db = req.app.locals.database;
        let collection = db.collection('assistance');
        const connector = new TwilioConnector();
        let messageText = await connector.getMessageBody(req.body.MessageSid);
        const textToRemove = 'Sent from your Twilio trial account - '
        messageText = messageText.replace(textToRemove, '');
        var messages = messageText.split('#');
        var errorMessage = validateMessage(messages);
        if (errorMessage === '') {
            const intents = getIntents(messages[0]);

            var assistanceData = {
                name: messages[1],
                phone: req.body.From,
                itemRequested: messages[0],
                address: messages[2],
                tag: intents
            };
            let myData = new assistance(assistanceData);
            await collection.insertOne(myData);
            var message = "We have received your message.Will be in touch shortly";
            await connector.sendMessage(req.body.To, req.body.From, message);
            res.json({ message: messageText });
        }
        else {
            await connector.sendMessage(req.body.To, req.body.From, errorMessage);
            res.json({ error: errorMessage });
        }
    }
    else {
        res.json({ error: 'Bad request' });
    }

};
