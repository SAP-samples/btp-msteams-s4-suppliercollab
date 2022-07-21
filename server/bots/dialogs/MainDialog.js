import { ComponentDialog, TextPrompt, WaterfallDialog, DialogSet,DialogTurnStatus } from 'botbuilder-dialogs'
import { NullTelemetryClient, InputHints } from 'botbuilder'
import { MessageFactory } from 'botbuilder'

const MAIN_DIALOG = "MainDialog";
const TEXT_PROMPT = 'TextPrompt';
const MAIN_WATERFALL_DIALOG = 'MainWaterfallDialog';
const purchaseOrderDetails = "purchaseOrderDetails";

import { getLineItemDetailsCard, getPOItemsDetailCard } from "../../bots/utils/BotRequestHelper.js"

class MainDialog extends ComponentDialog  {

    constructor(dialogs, storage){
        super(MAIN_DIALOG)
        this.addDialog(new TextPrompt(TEXT_PROMPT))

        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG,[
            this.actionStep.bind(this)
        ]));

        this.addDialog(dialogs.searchPODialog);
        this.addDialog(dialogs.getLineItemDialog);
        this.addDialog(dialogs.getPOItemsDetailDialog);
        this._botStorage = storage

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

     async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        dialogContext.dialogs.telemetryClient = new NullTelemetryClient();

        const results = await dialogContext.continueDialog();

        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

     async introStep(stepContext) {
        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : `What can I help you with today?!`;
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);        
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

      async actionStep(stepContext) {
        if(stepContext.context.activity.text != undefined){
            const utterance = stepContext.context.activity.text.trim().toLocaleLowerCase();
            const value = parseInt(utterance)

            if(utterance.includes('Get Line Item Details for'.toLocaleLowerCase())){
                console.log(stepContext.context.activity.replyToId)
                 return await stepContext.beginDialog('getLineItemDialog', InputHints.IgnoringInput);
    
            } else if(typeof value == 'number' && utterance.length === 10){
                return await stepContext.beginDialog('searchPODialog', InputHints.IgnoringInput);
            }
            else{
                 // Catch all for unhandled intents
                 const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way.`;
                 return await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            }

        } else if(stepContext.context.activity.value.origin.toUpperCase() === 'eventPOCard'.toUpperCase() ){
            return await stepContext.beginDialog('getPOItemsDetailDialog', InputHints.IgnoringInput);
        } else if(stepContext.context.activity.value.origin.toUpperCase() === 'lineItemDetailsCard'.toUpperCase() &&
        stepContext.context.activity.value.action.toUpperCase() === 'No'.toUpperCase()){

            console.log("replyToId: at adaptive card No button click")
            console.log(stepContext.context.activity.replyToId);

            const cardData = stepContext.context.activity.value.dataStore
            const graphStore = stepContext.context.activity.value.graphStore
            const card = await getLineItemDetailsCard(cardData, graphStore,stepContext.context.activity.value.action);
            const message = MessageFactory.attachment(card);
            message.id = stepContext.context.activity.replyToId;
            return await stepContext.context.updateActivity(message,InputHints.IgnoringInput); 

        } else if(stepContext.context.activity.value.origin.toUpperCase() === 'poItemsDetailCard'.toUpperCase() &&
        stepContext.context.activity.value.action.toUpperCase() === 'No'.toUpperCase()){

            console.log("replyToId: at adaptive card No button click")
            console.log(stepContext.context.activity.replyToId);

            const cardData = stepContext.context.activity.value.dataStore
            const graphStore = stepContext.context.activity.value.graphStore
            const card = await getPOItemsDetailCard(cardData, graphStore,stepContext.context.activity.value.action);
            const message = MessageFactory.attachment(card);
            message.id = stepContext.context.activity.replyToId;
            return await stepContext.context.updateActivity(message,InputHints.IgnoringInput); 

        } 
       
        return await stepContext.next();
    }

    async finalStep(stepContext) {
        //return await stepContext.replaceDialog(this.initialDialogId);

        if (stepContext.result) {
            const msg = `I have created a this result`;
            await stepContext.context.sendActivity(msg);
        }
        return await stepContext.endDialog();

    }
}
export default MainDialog