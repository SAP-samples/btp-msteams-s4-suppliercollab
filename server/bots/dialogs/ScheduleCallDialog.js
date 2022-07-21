import { WaterfallDialog, ChoicePrompt } from 'botbuilder-dialogs'
import { ActivityTypes } from 'botbuilder'

const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG  = 'WaterfallDialog';

import CancelAndHelpDialog from './utils/CancelAndHelpDialog.js';
import SsoOAuthPrompt from './utils/SsoOAuthPrompt.js'
import GraphClient from '../../services/GraphClient.js';

const OAUTH_PROMPT_GRAPH = 'OAuthPromptGraph';
const OAUTH_PROMPT_BTP = 'OAuthPromptBtp';

class ScheduleCallDialog extends CancelAndHelpDialog{

    constructor(dialogId){
        super(dialogId || 'scheduleCallDialog')

        
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

            this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

            this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getGraphToken.bind(this),
                this.getGraphData.bind(this),
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async getGraphToken(stepContext) {  
        return await stepContext.beginDialog(OAUTH_PROMPT_GRAPH);
    }

    async getGraphData(stepContext) { 
        
        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });
        const graphClient = new GraphClient(stepContext.result.token);

        const profile = await graphClient.getProfile();
        console.log(profile)
        stepContext.values.graphData = { profile : profile };

        return await stepContext.endDialog();
    }
    
} 

export default ScheduleCallDialog;