import { ActivityTypes } from "botbuilder";
import { WaterfallDialog } from "botbuilder-dialogs";
import { NullTelemetryClient, InputHints } from 'botbuilder'
import core from '@sap-cloud-sdk/core'

import AuthClient from "../../services/AuthClient.js";
import CancelAndHelpDialog from "./utils/CancelAndHelpDialog.js";
import SsoOAuthPrompt from "./utils/SsoOAuthPrompt.js";
import { getLineItemDetailsCard } from "../utils/BotRequestHelper.js";
import { executeS4API } from '../../services/S4Client.js';

const WATERFALL_DIALOG  = 'WaterfallDialog';

const OAUTH_PROMPT_GRAPH = 'OAuthPromptGraph';
const OAUTH_PROMPT_BTP = 'OAuthPromptBtp';

class GetLineItemDialog extends CancelAndHelpDialog{

    constructor(dialogId, storage){
        super(dialogId || 'getLineItemDialog');

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
            this.getLineItem.bind(this)
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
        stepContext.values.graphData = {token: stepContext.result.token};

        return await stepContext.next('Success');
        
    }


    async getLineItem(stepContext) { 

        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });

        const authClient = new AuthClient();
        const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', stepContext.result.token);
        console.log(btpOAuthToken);


        const selectedPOId = stepContext.context.activity.value.purchaseOrder;
        console.log("GetLineItemDialog :")
        console.log(selectedPOId)

        const filterArr = stepContext.context.activity.text.split(' ').filter(item => Number(item) && item.length == 10 );
        const POId = filterArr[0];

        const filterItemNum = stepContext.context.activity.text.split(' ').filter(item => Number(item) && item.length == 5 );
        const selectedPurchaseOrderItem = filterItemNum[0];
        console.log(selectedPurchaseOrderItem)

        const purchaseOrderDetails = await this.getPODetailsUsingCloudSdk(POId, btpOAuthToken)
        console.log(purchaseOrderDetails);

        const cardData = {...purchaseOrderDetails[0],selectedPurchaseOrderItem }
        
        if(purchaseOrderDetails.length != 0){
            const card = await getLineItemDetailsCard(cardData, stepContext.values.graphData);
            return await stepContext.context.sendActivity({ attachments: [card] });
        }else{
            const didntUnderstandMessageText = `Sorry, I didn't get purchase order details for ${POId}. Please try asking in a different way.`;
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
export default GetLineItemDialog;