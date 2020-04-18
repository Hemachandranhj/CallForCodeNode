require("../config/config.js");
const getCredential = require("../service/credential-service");
const credential = getCredential("user-provided");

const accountSid = credential.twilio_account_sid || global.gConfig.accountSid;
const authToken = credential.twilio_auth_token || global.gConfig.authToken;

class TwilioConnector {

    constructor() {

    }
    getMessageBody(messageId) {
        const client = require("twilio")(accountSid, authToken);
        return new Promise(function(resolve, reject) {
            client.messages(messageId)
                .fetch(function(err, message) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(message.body);
                    }
                });
        });
    }

    sendMessage(from, to, message) {
        const client = require("twilio")(accountSid, authToken);
        return new Promise(function(resolve, reject) {
            client.messages.create({
                body: message,
                from: global.gConfig.messageFrom,
                to: global.gConfig.messageTo,
            }, function(err, message) {
                if (err) {
                    reject(err);
                } else {
                    resolve(message.body);
                }
            });
        });
    }
}

module.exports = TwilioConnector;
