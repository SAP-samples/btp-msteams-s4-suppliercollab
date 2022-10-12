import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { v4 as uuidv4 } from 'uuid';

class GraphClient {
  constructor(token) {
    if (!token || !token.trim()) {
      throw new Error("GraphClient: Invalid token received.");
    }

    this._token = token;

    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, this._token);
      },
    });
  }

  async getProfile() {
    try {
      return await this.graphClient.api("/me").get();
    } catch (error) {
      return {};
    }
  }

  async getCalendars() {
    try {
      return await this.graphClient.api("/me/calendar").get();
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async getCalendarsGroups(){
    try {
      let calendarGroups = await this.graphClient.api('/me/calendarGroups').get();
      return calendarGroups
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async getInstalledApps(){
    const teamsAppExtId = process.env.TEAMS_APP_EXTERNAL_ID;
    return await this.graphClient
    .api(`/appCatalogs/teamsApps?$filter=externalId eq '${teamsAppExtId}'`)
    .get();
  }

  async addAppInChat(appId, chatId){

    const teamsAppInstallation = {
      'teamsApp@odata.bind':`https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${appId}`
   };
   return await this.graphClient.api(`/chats/${chatId}/installedApps`)
     .post(teamsAppInstallation);
  }

  async addTabToMeeting(appId, chatId){
    const domain = process.env.DOMAIN;
    const tabMeetingJson = {
      "displayName": "Purchase Order Summary",
      "teamsApp@odata.bind" : `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${appId}`,
      "configuration": {
        "entityId": "Side Panel App",
        "contentUrl": `https://${domain}/podetails`,
        "websiteUrl": `https://${domain}/podetails`
      }
    }
   return await this.graphClient.api(`/chats/${chatId}/tabs`)
     .post(tabMeetingJson);
  }

  async CreateMeeting(data,context){

    const transactionId = uuidv4(); 

    try{
      const event = {
        subject: data.purchasingDocInputId,
        body: {
          contentType: 'HTML',
          content: data.detailsInputId
        },
        start: {
            dateTime: data.startInputId+'T'+data.fromInputId,
            timeZone: context._activity.localTimezone
        },
        end: {
            dateTime: data.startInputId+'T'+data.toInputId,
            timeZone: context._activity.localTimezone
        },
        location: {
            displayName: data.locationId
        },
        attendees: [
          {
            emailAddress: {
              address: process.env.ATTENDEES_EMAILADDRESS,
              name: process.env.ATTENDEES_NAME
            },
            type: 'required'
          }
        ],
        transactionId: transactionId,
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness'
      };

      const installApps = await this.getInstalledApps()
      const teamAppId = installApps.value[0].id
      console.log("Team App ID :"+ teamAppId)

      const createdEvent = await this.graphClient.api(`/me/calendar/events`).post(event);
      const chatId = decodeURIComponent(createdEvent.onlineMeeting.joinUrl).split("/")[5]
      console.log("Chat App ID :"+ chatId)

      const appInChatRes = await this.addAppInChat(teamAppId, chatId)
      console.log(appInChatRes)

      const tabInMeetingRes = await this.addTabToMeeting(teamAppId, chatId)
      console.log(tabInMeetingRes)

      return createdEvent;

    }catch(error){
      console.error(error)
      return {}
    }
  }
}

export default GraphClient;
