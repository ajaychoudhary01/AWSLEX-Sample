'use strict';

 // --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------
var aws = require('aws-sdk');
var ses = new aws.SES({
   region: 'us-west-2'
});
function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function close(sessionAttributes, sender, fulfillmentState, message) {
    
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------

function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateCurrency(currency) {
    const currencyTypes = ['BITCOIN', 'RIPPLE', 'ETHEREUM', 'LITCOIN'];
    if (currencyTypes && currencyTypes.indexOf(currency.toUpperCase()) === -1) {
        return buildValidationResult(false, 'currency', `We do not have ${currency}, would you like a to send/request differeny cryptocurrent?.`);
    }
    return buildValidationResult(true, null, null);
}

function validateAmount(amount) {
    if(amount <= 0){
        return buildValidationResult(false, 'amount', `I can not sent ${amount}, please provide amount greater than 0.`);
    }
    return buildValidationResult(true, null, null);
}

 // --------------- Functions that control the bot's behavior -----------------------

function crptotransfer(intentRequest, callback) {
    const currency = intentRequest.currentIntent.slots.currency;
    const receiver = intentRequest.currentIntent.slots.receiver;
    const sender = intentRequest.currentIntent.slots.send;
    const amount = intentRequest.currentIntent.slots.amount;
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        if(currency){
        const validationResult = validateCurrency(currency);
        //validationResult = validateCardType(cardType, salary);
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        }
        if(amount){
            const validationResult = validateAmount(amount);
            if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        }
        const outputSessionAttributes = intentRequest.sessionAttributes;
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
        }
        var eParams = {
        Destination: {
            ToAddresses: [sender]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Please provide your approval to send ' + amount + ' ' + currency + ' to ' + receiver + '.' + 'Just Reply Approve/ok to approve or reject/cancel to reject this transaction.'
                }
            },
            Subject: {
                Data: 'Approval to send ' + currency 
            }
        },
        Source: "ajaychoudhary091989@gmail.com"
    };

    console.log('===SENDING EMAIL===');
    var email = ses.sendEmail(eParams, function(err, data){
        if(err) console.log(err);
        else {
            console.log("===EMAIL SENT===");
            console.log(data);


            console.log("EMAIL CODE END");
            console.log('EMAIL: ', email);
            //context.succeed(event);

        }});
    callback(close(intentRequest.sessionAttributes, sender, 'Fulfilled',
    { contentType: 'PlainText', content: `Thanks, we will request to send ${amount} ${currency} from ${sender} to ${receiver} account, it will be done once ${sender} approve transaction by email.` }));
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'crptotransfer') {
        return crptotransfer(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.bot.name=${event.bot.name}`);
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
