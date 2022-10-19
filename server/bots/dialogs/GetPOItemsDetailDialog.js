import { ActivityTypes } from "botbuilder";
import { WaterfallDialog } from "botbuilder-dialogs";
import { NullTelemetryClient, InputHints } from 'botbuilder'
import core from '@sap-cloud-sdk/core'

import AuthClient from "../../services/AuthClient.js";
import CancelAndHelpDialog from "./utils/CancelAndHelpDialog.js";
import SsoOAuthPrompt from "./utils/SsoOAuthPrompt.js";
import { getPOItemsDetailCard } from "../utils/BotRequestHelper.js";
import GraphClient from "../../services/GraphClient.js";

const WATERFALL_DIALOG  = 'WaterfallDialog';

const OAUTH_PROMPT_GRAPH = 'OAuthPromptGraph';
const OAUTH_PROMPT_BTP = 'OAuthPromptBtp';

class GetPOItemsDetailDialog extends CancelAndHelpDialog{

    constructor(dialogId, storage){
        super(dialogId || 'getPOItemsDetailDialog');

        // Add OAuth prompt to obtain Graph Connection token to the dialog
        this.addDialog(new SsoOAuthPrompt(OAUTH_PROMPT_GRAPH, {
            connectionName: process.env.CONNECTION_NAME_GRAPH,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

          // Add OAuth prompt to obtain SAP BTP Connection token to the dialog
          this.addDialog(new SsoOAuthPrompt(OAUTH_PROMPT_BTP, {
            connectionName: process.env.CONNECTION_NAME_BTP,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));
        
        this._botStorage = storage;

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.getGraphToken.bind(this),
            this.getGraphData.bind(this),
            this.getBtpToken.bind(this),
            this.getPOItemsDetail.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async getBtpToken(stepContext) {   
        return await stepContext.beginDialog(OAUTH_PROMPT_BTP);
    }

    async getGraphToken(stepContext) {  
        return await stepContext.beginDialog(OAUTH_PROMPT_GRAPH);
    }

    async getGraphData(stepContext) { 
        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });
        const graphClient = new GraphClient(stepContext.result.token);

        const profile = await graphClient.getProfile();
        stepContext.values.graphData = {token: stepContext.result.token,profile : profile};

        return await stepContext.next('Success');
        
    }


    async getPOItemsDetail(stepContext) { 

        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });
        const cardData = stepContext.context.activity.value.dataStore;
        const card = await getPOItemsDetailCard(cardData, stepContext.values.graphData);
        return await stepContext.context.sendActivity({ attachments: [card] });
    }

}
export default GetPOItemsDetailDialog;