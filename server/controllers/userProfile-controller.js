const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');

const userProfileSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    contactNumber: String,
    AddressLine1: String,
    AddressLine2: String,
    AddressLine3: String,
    city: String,
    country: String,
    postCode: String,
    date: { type: Date, default: Date.now }
});

const userProfile = mongoose.model("userProfile", userProfileSchema);

function validateMessage(messages) {
    let errorMessage = "";

    if (messages.length < 3) {
        errorMessage =
            "Incorrect format.Please send in the format ItemsNeeded#Name#Address";
    }

    return errorMessage;
}

// get all userProfile
exports.getUserProfile = async (req, res) => {
    let db = req.app.locals.database;
    let collection = db.collection("userProfile");
    collection.find({}).sort({ date: -1 }).toArray(function (err, result) {
        if (err) {
            res.json({ error: err.message })
        }
        res.json({ result })
    });
};

// accept userProfile request
exports.updateProfileRequest = async (req, res) => {
    if (req.body.id) {
        let db = req.app.locals.database;
        let collection = db.collection("userProfile");
        await collection.updateOne(
            { "_id": ObjectId(req.body.id) },
            { $set: { "isActioned": true } },
            function (err, doc) {
                if (err) {
                    throw err;
                }
                else {
                    var message = "User profile successfully submitted for user" + req.body.email;
                }
                res.json({ message: "Accepted" });
            });
    } else {
        res.json({ error: "Bad request" });
    }
};

// store userProfile request
exports.postUserProfileRequest = async (req, res) => {
    if (req.body.MessageSid) {
        let db = req.app.locals.database;
        let collection = db.collection("userProfile");

        let userProfileRequest = req.body;
        const intents = await getIntents(messages[0]);

        var userProfileData = {
            firstName: userProfileRequest.firstName,
            lastName: userProfileRequest.lastName,
            email: userProfileRequest.email,
            contactNumber: userProfileRequest.contactNumber,
            AddressLine1: userProfileRequest.AddressLine1,
            AddressLine2: userProfileRequest.AddressLine2,
            AddressLine3: userProfileRequest.AddressLine3,
            city: userProfileRequest.city,
            country: userProfileRequest.country,
            postCode: userProfileRequest.postCode
        };

        let myData = new userProfile(userProfileData);
        await collection.insertOne(myData);
        var messageText =
            "User profile has been submitted successfully";
        res.json({ message: messageText });
    }
};
