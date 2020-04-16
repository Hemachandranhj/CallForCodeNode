const config = require('../config/config.js');
const accountSid = global.gConfig.accountSid;
const authToken = global.gConfig.authToken;
const client = require('twilio')(accountSid, authToken);

class TwilioConnector {

    constructor()
    {

    }
    getMessageBody(messageId)
    {
        return new Promise(function(resolve, reject) {
            client.messages(messageId)
            .fetch(function(err,message)
            {
                if(err)
                { reject(err);
                }
                else{              
                resolve(message.body);
                }
            })           
         } );
    }

    sendMessage(from, to, message)
    {
        return new Promise(function(resolve, reject) {
            client.messages.create({
                body: message,
                from: global.gConfig.messageFrom, 
                to: global.gConfig.messageTo
              }, function(err,message)
            {
                if(err)
                { reject(err);
                }
                else{              
                resolve(message.body);
                }
            })           
         } );
    }

}

module.exports = TwilioConnector;