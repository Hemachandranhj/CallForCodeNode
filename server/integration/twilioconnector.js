// ToDo: Need to remove the hardcoded values

const accountSid = 'AC4f5a81aa7fea225ffcb3ea6ea78f8707';
const authToken = '838aacfe059ad7f81adf25960962b084';
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

    sendMessage(from, to, message, callbackUrl)
    {
        return new Promise(function(resolve, reject) {
            client.messages.create({
                body: message,
                from: '+18142819718', 
                to: '+44 7438 507419',
                statusCallback: callbackUrl
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