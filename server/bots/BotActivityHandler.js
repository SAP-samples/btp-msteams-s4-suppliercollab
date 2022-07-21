import {
  TeamsActivityHandler,
  ConversationState,
  UserState,
  tokenExchangeOperationName,
  TurnContext,
  CardFactory,
  MessageFactory,
  InputHints
} from "botbuilder";

import moment from "moment-timezone";

import { BlobsStorage } from "botbuilder-azure-blobs";
import MainDialog from "./dialogs/MainDialog.js";
import SearchPODialog from "./dialogs/SearchPODialog.js";
import TokenExchangeHelper from "./utils/TokenExchangeHelper.js"

import { getWelcomeCard,
        getScheduleCallCard,
        getLineItemDetailsCard,
        getPOItemsDetailCard, 
        getScheduleCallPOEventCard} 
        from "../bots/utils/BotRequestHelper.js";

import ScheduleCallDialog from "./dialogs/ScheduleCallDialog.js";

import ScheduleCallPOEventCard from "./dialogs/ScheduleCallPOEventDialog.js"
import GetLineItemDialog from "./dialogs/GetLineItemDialog.js";
import GetPOItemsDetailDialog from "./dialogs/GetPOItemsDetailDialog.js";
import GraphClient from "../services/GraphClient.js";

// Set further configuration parameters
const USER_CONFIGURATION = "userConfigurationProperty";
const conversationReferencesStoragePropertyName = "conversationReferences";
const CONVERSATION_DATA_PROPERTY = "conversationPOData"

const SEARCH_PO_DIALOG = 'searchPODialog';
const SCHEDULE_CALL_DIALOG ='scheduleCallDialog'
const SCHEDULE_CALL_PO_EVENT_DIALOG ='scheduleCallPOEventDialog'
const GET_LINEITEM_DIALOG ='getLineItemDialog'
const GET_POITEMSDETAIL_DIALOG ='getPOItemsDetailDialog'

const meetingDataStoragePropertyName = "meetingData";

class BotActivityHandler extends TeamsActivityHandler {
  constructor(
    conversationState,
    userState,
    dialog,
    storage,
    conversationReferences
  ) {
    super();

    if (!conversationState)
      throw new Error("[DialogBot]: Missing parameter. conversationState is required");
    if (!userState)
      throw new Error("[DialogBot]: Missing parameter. userState is required");
    if (!dialog)
      throw new Error("[DialogBot]: Missing parameter. dialog is required");
    if (!conversationReferences)
      throw new Error("[DialogBot]: Missing parameter. dialog is required");

    this.conversationState = conversationState;
    this.userState = userState;

    this.dialog = dialog;
    this.scheduleCallCard= new ScheduleCallDialog(SCHEDULE_CALL_DIALOG)
    this.scheduleCallPoEventCard= new ScheduleCallPOEventCard(SCHEDULE_CALL_PO_EVENT_DIALOG)

    this.dialogState = this.conversationState.createProperty("DialogState");
    this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
    
    this.userConfigurationProperty =
      userState.createProperty(USER_CONFIGURATION);
    this._botStorage = storage;

    this.conversationReferences = conversationReferences;

    this._ssoOAuthHelperGraph = new TokenExchangeHelper(
      process.env.CONNECTION_NAME_GRAPH,
      storage
    );
    this._ssoAuthHelperBtp = new TokenExchangeHelper(
      process.env.CONNECTION_NAME_BTP,
      storage
    );
    
    this.onMessage(async (context, next) => {
        console.log('Running dialog with Message Activity.');
        await this.dialog.run(context, this.dialogState);
        await next();
      });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member = 0; member < membersAdded.length; member++) {
        if (membersAdded[member].id !== context.activity.recipient.id) {
          const card = await getWelcomeCard();
          await context.sendActivity({ attachments: [card] });
          //await dialog.run(context, conversationState.createProperty('DialogState'));
        }
      }
      await next();
    });


    this.onConversationUpdate(async (context, next) => {
        const conversationReference = TurnContext.getConversationReference(
          context.activity
        );
        const userId = conversationReference.user?.aadObjectId;
        if (userId) {
          try {
            // Conversation Reference is stored in the BlobStorage container if not available yet
            const storeItems = await this._botStorage.read([
              conversationReferencesStoragePropertyName,
            ]);
            if (!storeItems[conversationReferencesStoragePropertyName])
              storeItems[conversationReferencesStoragePropertyName] = {};
            const conversationReferences =
              storeItems[conversationReferencesStoragePropertyName];
            conversationReferences[userId] = conversationReference;
            await this._botStorage.write(storeItems);
            this.addConversationReference(context.activity);
          } catch (error) {
            console.log(error);
          }
        }
        await next();
      });
  }

  async addConversationReference(activity) {
    const conversationReference =
      TurnContext.getConversationReference(activity);
    this.conversationReferences[conversationReference.user.aadObjectId] =
      conversationReference;
  }

  async getConversationReference(userId) {
    try {
      const storeItems = await this._botStorage.read([
        conversationReferencesStoragePropertyName,
      ]);
      if (!storeItems[conversationReferencesStoragePropertyName]) return null;
      const conversationReferences =
        storeItems[conversationReferencesStoragePropertyName];
      const conversationReference = conversationReferences[userId];
      return conversationReference;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async run(context) {
    await super.run(context);
    // Save any state changes. The load happened during the execution of the Dialog.
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }

  /**
   * Override the TeamsActivityHandler.onInvokeActivity() according to Microsoft Teams samples for Single Sign On
   */
   async onInvokeActivity(context) {
    const valueObj = context.activity.value;

    if (valueObj.authentication) {
      const authObj = valueObj.authentication;
      if (authObj.token) {
        // If the token is NOT exchangeable, then do NOT deduplicate requests.
        if (await this.tokenIsExchangeable(context)) {
          return await super.onInvokeActivity(context);
        } else {
          const response = {
            status: 412,
          };
          return response;
        }
      }
    }
    return await super.onInvokeActivity(context);
  }

  /**
   * Override the TeamsActivityHandler.tokenIsExchangeable() according to Microsoft Teams samples for Single Sign On
   */
   async tokenIsExchangeable(context) {
    let tokenExchangeResponse = null;
    try {
      const valueObj = context.activity.value;
      const tokenExchangeRequest = valueObj.authentication;
      tokenExchangeResponse = await context.adapter.exchangeToken(
        context,
        process.env.CONNECTION_NAME_GRAPH,
        context.activity.from.id,
        { token: tokenExchangeRequest.token }
      );
    } catch (err) {
      console.log("tokenExchange error: " + err);
      // Ignore Exceptions
      // If token exchange failed for any reason, tokenExchangeResponse above stays null,
      // and hence we send back a failure invoke response to the caller.
    }
    if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
      return false;
    }
    return true;
  }

  /**
   * Override the TeamsActivityHandler.handleTeamsSigninVerifyState() according to Microsoft Teams samples for Single Sign On
   */
   async handleTeamsSigninVerifyState(context, state) {
    await this.dialog.run(context, this.dialogState);
  }

  /**
   * Override the TeamsActivityHandler.onSignInInvoke() according to Microsoft Teams samples for Single Sign On
   *
   * This is invoked when the TokenExchangeInvokeRequest is coming back from the Client
   * https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/auth-aad-sso-bots
   */
   async onSignInInvoke(context) {
    // The tokenExchangeOperationName should be signin/tokenExchange
    if (
      context.activity &&
      context.activity.name === tokenExchangeOperationName
    ) {
      // The ssoOAuthHelper will attempt the exchange, and if successful, it will cache the result in TurnState.
      // This is then read by SsoOAuthPrompt, and processed accordingly

      if (
        context.activity.value.CONNECTION_NAME_GRAPH ===
        process.env.CONNECTION_NAME_BTP
      ) {
        // If the token is not exchangeable, do not process this activity further.
        // The ssoOAuthHelper will send the appropriate response if the token is not exchangeable.
        if (
          !(await this._ssoOAuthHelperBtp.shouldProcessTokenExchange(context))
        )
          return;
      }

      if (
        context.activity.value.CONNECTION_NAME_GRAPH ===
        process.env.CONNECTION_NAME_GRAPH
      ) {
        if (
          !(await this._ssoOAuthHelperGraph.shouldProcessTokenExchange(context))
        )
          return;
      }
    }
    // Run the dialog with the new context including the exchanged token
    await this.dialog.run(context, this.dialogState);
  }

  /**
   * Override the TeamsActivityHandler.onTokenResponseEvent() according to Microsoft Teams samples for Single Sign On
   */
   async onTokenResponseEvent(context) {
    // Run the Dialog with the new Token Response Event Activity.
    await this.dialog.run(context, this.dialogState);
  }

  /**
   * Helper method to get new token for messaging extension scenario
   * Makes use of the silentAuth adaptive card allowing Single Sign On
   */
   async _getTokenForConnectionMsgExt(context, connection) {
    // There is no token, so the user has not signed in yet.
    // Retrieve the OAuth Sign in Link to use in the MessagingExtensionResult Suggested Actions
    const signInLink = await context.adapter.getSignInLink(context, connection);

    return {
      composeExtension: {
        type: "silentAuth",
        suggestedActions: {
          actions: [
            {
              type: "openUrl",
              value: signInLink,
              title: "Setup your access for the first time!",
            },
          ],
        },
      },
    };
  }

   /**
   * Helper method to get new token for the tab extension scenario implemented va the bot framework
   * Makes use of the auth adaptive card, which does not support single sign on
   * silentAuth adaptive card is not working in case of tabs implemented via the bot framework
   */
    async _getTokenForConnectionTabCards(context, connection) {
      // Retrieve the OAuth Sign in Link
      const signInLink = await context.adapter.getSignInLink(context, connection);
  
      return {
        tab: {
          type: "auth",
          suggestedActions: {
            actions: [
              {
                type: "openUrl",
                value: signInLink,
                title: "Sign in to this app",
              },
            ],
          },
        },
      };
    }

  async handleTeamsTaskModuleFetch(context, taskModuleRequest) {
    if(taskModuleRequest.data.origin === 'lineItemDetailsCard') {
   var date = new Date(new Date() .toLocaleString(context._activity.locale, 
    { timeZone: context._activity.localTimezone }));

    const replyToId = context._activity.replyToId;
    console.log("replyToId: at Task Module Fetch")
    console.log(replyToId);
    
    await this.updateGetListItemCard(context,taskModuleRequest,replyToId);

    taskModuleRequest.data.graphStore.date = date;
      const card = await getScheduleCallCard(taskModuleRequest.data.dataStore, 
        taskModuleRequest.data.graphStore,replyToId);
      return {
        task: {
          type: "continue",
          value: {
            card: {
              contentType: "application/vnd.microsoft.card.adaptive",
              content: card.content,
            },
            heigth: 1000,
            width: 1000,
            title: "Schedule Call",
          },
        },
      };
    } else if(taskModuleRequest.data.origin === 'poItemsDetailCard') {
      var date = new Date(new Date() .toLocaleString(context._activity.locale, 
       { timeZone: context._activity.localTimezone }));
   
       const replyToId = context._activity.replyToId;
       console.log("replyToId: at Task Module Fetch")
       console.log(replyToId);
       
       await this.updatePOItemsDetailCard(context,taskModuleRequest,replyToId);
   
       taskModuleRequest.data.graphStore.date = date;
         const card = await getScheduleCallPOEventCard(taskModuleRequest.data.dataStore, 
           taskModuleRequest.data.graphStore,replyToId);
         return {
           task: {
             type: "continue",
             value: {
               card: {
                 contentType: "application/vnd.microsoft.card.adaptive",
                 content: card.content,
               },
               heigth: 1000,
               width: 1000,
               title: "Schedule Call",
             },
           },
         };
       } 
    return await super.handleTeamsTaskModuleFetch(context, taskModuleRequest);
  }

  async handleTeamsTaskModuleSubmit(context, taskModuleRequest){
    if(taskModuleRequest.data.origin === 'scheduleCallCard' 
        && taskModuleRequest.data.action === 'Close') {

          const replyToId = taskModuleRequest.data.replyToId;
          console.log("lms - replyToId: at Task Module Submit")
          console.log(replyToId);

          await this.updateGetListItemCard(context,taskModuleRequest,taskModuleRequest.data.replyToId);

          
      return null;
    }else if(taskModuleRequest.data.origin === 'scheduleCallCard' 
    && taskModuleRequest.data.action === 'Schedule'){

      const graphClient = new GraphClient(taskModuleRequest.data.graphStore.token);

        const onlineMeeting = await graphClient.CreateMeeting(taskModuleRequest.data,context);
        await this.saveMeetingData(taskModuleRequest.data,onlineMeeting)
        console.log(onlineMeeting);

        await this.updateGetListItemCard(context,taskModuleRequest,taskModuleRequest.data.replyToId);

        const organizer = onlineMeeting.organizer.emailAddress.name.split(' ')[0];
        const attendees = onlineMeeting.attendees[0].emailAddress.name.split(' ')[0];

        const from = moment.tz(onlineMeeting.start.dateTime, onlineMeeting.start.timeZone);
        const to = moment.tz(onlineMeeting.end.dateTime, onlineMeeting.end.timeZone);
        const diff = to.diff(from, 'hours') 

        const message = `Hello ${organizer}, your meeting has been scheduled for ${onlineMeeting.subject} with ${attendees} on date ${from.format('LL')} at ${from.format('LT')} for ${diff} hour`

      return {
          task: {
              type: 'message',
              value: message
          }
      };
    } else if(taskModuleRequest.data.origin === 'scheduleCallPOEventCard' 
    && taskModuleRequest.data.action === 'Close') {

      const replyToId = taskModuleRequest.data.replyToId;
      console.log("lms - replyToId: at Task Module Submit")
      console.log(replyToId);

      await this.updatePOItemsDetailCard(context,taskModuleRequest,taskModuleRequest.data.replyToId);

      
  return null;
}else if(taskModuleRequest.data.origin === 'scheduleCallPOEventCard' 
&& taskModuleRequest.data.action === 'Schedule'){

  const graphClient = new GraphClient(taskModuleRequest.data.graphStore.token);

    const onlineMeeting = await graphClient.CreateMeeting(taskModuleRequest.data,context);
    await this.saveMeetingData(taskModuleRequest.data,onlineMeeting)
    console.log(onlineMeeting);

    await this.updatePOItemsDetailCard(context,taskModuleRequest,taskModuleRequest.data.replyToId);

    const organizer = onlineMeeting.organizer.emailAddress.name.split(' ')[0];
    const attendees = onlineMeeting.attendees[0].emailAddress.name.split(' ')[0];

    const from = moment.tz(onlineMeeting.start.dateTime, onlineMeeting.start.timeZone);
    const to = moment.tz(onlineMeeting.end.dateTime, onlineMeeting.end.timeZone);
    const diff = to.diff(from, 'hours') 

    const message = `Hello ${organizer}, your meeting has been scheduled for ${onlineMeeting.subject} with ${attendees} on date ${from.format('LL')} at ${from.format('LT')} for ${diff} hour`

  return {
      task: {
          type: 'message',
          value: message
      }
  };
}

    return await super.handleTeamsTaskModuleSubmit(context, taskModuleRequest);
  }

  async updateGetListItemCard(context,taskModuleRequest,replyToId){
    const card = await getLineItemDetailsCard(taskModuleRequest.data.dataStore,
      taskModuleRequest.data.graphStore,taskModuleRequest.data.action)
    const message = MessageFactory.attachment(card);
    message.id = replyToId;
    await context.updateActivity(message,InputHints.IgnoringInput); 
  }

  async updatePOItemsDetailCard(context,taskModuleRequest,replyToId){
    const card = await getPOItemsDetailCard(taskModuleRequest.data.dataStore,
      taskModuleRequest.data.graphStore,taskModuleRequest.data.action);
    const message = MessageFactory.attachment(card);
    message.id = replyToId;
    await context.updateActivity(message,InputHints.IgnoringInput); 
  }

  async getMeetingDataByChatId(chatId){
    const storeItems = await this._botStorage.read([
      meetingDataStoragePropertyName,
    ]);
    const meetingData = storeItems[meetingDataStoragePropertyName];
    return meetingData[chatId];
  }

  async saveMeetingData(data,createdEvent){
    const chatId = decodeURIComponent(createdEvent.onlineMeeting.joinUrl).split("/")[5]
    console.log("Chat App ID :"+ chatId)
    const storeItems = await this._botStorage.read([
      meetingDataStoragePropertyName,
    ]);
    if (!storeItems[meetingDataStoragePropertyName])
      storeItems[meetingDataStoragePropertyName] = {};
    const meetingData =
    storeItems[meetingDataStoragePropertyName];
    const dataStore = data.dataStore;
    let curMeetingData;
    if(dataStore.hasOwnProperty("to_PurchaseOrderItemTP")){
      const purchaseOrderItems = dataStore.to_PurchaseOrderItemTP.results.map(element => element.PurchaseOrderItem);
      curMeetingData = {
        purchasingDoc: dataStore.PurchaseOrder,
        purchasingGroup:dataStore.PurchasingGroup,
        supplierText:dataStore.Supplier_Text,
        purchaseOrderItems: purchaseOrderItems,
        selectedPurchaseOrderItem:dataStore.selectedPurchaseOrderItem
      }
    } else {
      const purchaseOrderItems = dataStore.pendconfitems.map(element => '000'+element.purchasingdocumentitem);
      curMeetingData = {
        purchasingDoc: dataStore.poid,
        purchasingGroup:'401',//change this to get from payload
        supplierText:dataStore.supplierName,
        purchaseOrderItems: purchaseOrderItems,
        selectedPurchaseOrderItem:purchaseOrderItems[0]
      }
    }

    
    console.log("Save Meeting data :")
    console.log(curMeetingData)
    
    meetingData[chatId] = curMeetingData;
    await this._botStorage.write(storeItems);
  } catch (error) {
    console.log(error);
  }
}

const storage = new BlobsStorage(
  process.env.MICROSOFT_BLOB_CONNECTION_STRING || "",
  process.env.MICROSOFT_BLOB_CONTAINER_NAME || ""
);

const searchPODialog =new SearchPODialog(SEARCH_PO_DIALOG, storage)
const getLineItemDialog = new GetLineItemDialog(GET_LINEITEM_DIALOG, storage)

const getPOItemsDetailDialog = new GetPOItemsDetailDialog(GET_POITEMSDETAIL_DIALOG, storage)

const conversationState = new ConversationState(storage);
const userState = new UserState(storage);



const mainDialog = new MainDialog({
  searchPODialog : searchPODialog,
  getLineItemDialog: getLineItemDialog,
  getPOItemsDetailDialog: getPOItemsDetailDialog
}, storage);

const conversationReferences = {};

const botActivityHandler = new BotActivityHandler(
  conversationState,
  userState,
  mainDialog,
  storage,
  conversationReferences
);

export default botActivityHandler;
