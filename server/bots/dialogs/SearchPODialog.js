import { WaterfallDialog, ChoicePrompt, ComponentDialog } from 'botbuilder-dialogs'
import { ActivityTypes} from 'botbuilder'
import { NullTelemetryClient, InputHints } from 'botbuilder'
import { getSearchPOCard } from "../utils/BotRequestHelper.js";

const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG  = 'WaterfallDialog';

import CancelAndHelpDialog from './utils/CancelAndHelpDialog.js';
import SsoOAuthPrompt from './utils/SsoOAuthPrompt.js'
import AuthClient from '../../services/AuthClient.js';
import GraphClient from '../../services/GraphClient.js';
import { executeS4API } from '../../services/S4Client.js';
import core from '@sap-cloud-sdk/core';



const OAUTH_PROMPT_GRAPH = 'OAuthPromptGraph';
const OAUTH_PROMPT_BTP = 'OAuthPromptBtp';

class SearchPODialog extends CancelAndHelpDialog{

    constructor(dialogId, storage){
            super(dialogId || 'searchPODialog');

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

            this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

            this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getGraphToken.bind(this),
                this.getGraphData.bind(this),
                this.getBtpToken.bind(this),
                this.searchPODetails.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

     async getGraphToken(stepContext) {  
        return await stepContext.beginDialog(OAUTH_PROMPT_GRAPH);
    }

    async getBtpToken(stepContext) {   
        return await stepContext.beginDialog(OAUTH_PROMPT_BTP);
    }

     async getGraphData(stepContext) { 
        
        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });
        const graphClient = new GraphClient(stepContext.result.token);

    
        const profile = await graphClient.getProfile();
        console.log(profile);

        stepContext.values.graphData = { profile : profile };
        return await stepContext.next('Success');
    }

     async searchPODetails(stepContext) { 

        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });
        const authClient = new AuthClient();
        const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', stepContext.result.token);
        console.log(btpOAuthToken);


        const POId = stepContext.context.activity.text;
        const purchaseOrderDetails = await this.getPODetailsUsingCloudSdk(POId, btpOAuthToken);

        console.log(purchaseOrderDetails);

        // const storeItems = await this._botStorage.read([
        //     purchaseOrderDetails,
        //   ]);

        if(purchaseOrderDetails.length != 0){

            // storeItems[purchaseOrderDetails] = {purchaseOrderDetails};
            // this._botStorage.write(storeItems);

            const card = await getSearchPOCard(purchaseOrderDetails[0]);
            await stepContext.context.sendActivity({ attachments: [card] });
        }else{
            const didntUnderstandMessageText = `Sorry, I didn't get paurchse order details for ${POId}. Please try asking in a different way.`;
             await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }

        return await stepContext.endDialog();
    }

    async  getPODetailsUsingCloudSdk(POId, jwtToken){

        const url =`/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/C_PurchaseOrderTP?$filter=PurchaseOrder eq '${POId}' &$format=json&$expand=to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation&$select=PurchaseOrder,PurchaseOrderType,PurchasingGroup,PurchaseOrderTypeName,ManufacturerMaterial,Plant,Supplier_Text,PurchaseOrderDate,to_PurchaseOrderItemTP/PurchaseOrderItem,to_PurchaseOrderItemTP/OrderPriceUnit, to_PurchaseOrderItemTP/OrderQuantity, to_PurchaseOrderItemTP/Plant, to_PurchaseOrderItemTP/Material,to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation/SupplierConfirmationCategory,to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation/DeliveryDate,to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation/DelivDateCategory,to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation/DeliveryTime,to_PurchaseOrderItemTP/to_PurOrdSupplierConfirmation/ConfirmedQuantity`
        try{
            let response = await executeS4API(url,"get","",jwtToken);
            return response.data.d.results;
        } catch(err){
            console.log(err)
            return err;
        }
    }
}

export default SearchPODialog;