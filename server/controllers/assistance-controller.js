const mongoose = require("mongoose");
const TwilioConnector = require("../integration/twilioconnector");
const getIntents = require("../integration/watsonconnector");
const {ObjectId} = require('mongodb');

const assistanceSchema = new mongoose.Schema({
    name: String,
    phone: String,
    itemRequested: String,
    address: String,
    tag: [String],
    date: { type: Date, default: Date.now },
    isActioned: { type: Boolean, default: false },
});

const assistance = mongoose.model("assistance", assistanceSchema);

function validateMessage(messages) {
    let errorMessage = "";

    if (messages.length < 3) {
        errorMessage =
            "Incorrect format.Please send in the format ItemsNeeded#Name#Address";
    }

    return errorMessage;
}

// get all assistance
exports.getAssistance = async (req, res) => {
    let db = req.app.locals.database;
    let collection = db.collection("assistance");
    collection.find({}).sort({ date: -1 }).toArray(function(err, result){
        if(err)
        {
            res.json({ error: err.message })            
        }
        res.json({result})
    });
};

// accept assistance request
exports.acceptRequest = async (req, res) => {
    if (req.body.id) {
        let db = req.app.locals.database;
        let collection = db.collection("assistance");
        await collection.updateOne(
            { "_id" : ObjectId(req.body.id) },
            { $set: { "isActioned" : true } },
            function(err,doc) {
            if (err) { 
            throw err; 
            }

            else { 
                const connector = new TwilioConnector();
                var message = "We have accepted your request. Our volunter " + req.body.name + " will call you shortly to help you";
                connector.sendMessage(req.body.from, req.body.phone, message);
            }
        res.json({ message: "Accepted" });
      });
    } else {
        res.json({ error: "Bad request" });
    }    
};

// store assistance request
exports.storeAssistanceRequest = async (req, res) => {
    if (req.body.MessageSid) {
        let db = req.app.locals.database;
        let collection = db.collection("assistance");
        const connector = new TwilioConnector();
        let messageText = await connector.getMessageBody(req.body.MessageSid);
        const textToRemove = "Sent from your Twilio trial account - ";
        messageText = messageText.replace(textToRemove, "");
        var messages = messageText.split("#");
        var errorMessage = validateMessage(messages);
        if (errorMessage === "") {
            const intents = await getIntents(messages[0]);

            var assistanceData = {
                name: messages[1],
                phone: req.body.From,
                itemRequested: messages[0],
                address: messages[2],
                tag: intents,
            };
            let myData = new assistance(assistanceData);
            await collection.insertOne(myData);
            var message =
                "We have received your message.Will be in touch shortly";
            await connector.sendMessage(req.body.To, req.body.From, message);
            res.json({ message: messageText });
        } else {
            await connector.sendMessage(
                req.body.To,
                req.body.From,
                errorMessage
            );
            res.json({ error: errorMessage });
        }
    } else {
        res.json({ error: "Bad request" });
    }
};
