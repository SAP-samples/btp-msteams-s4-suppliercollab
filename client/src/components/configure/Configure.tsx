import React from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { Text, Form,
     } from "@fluentui/react-northstar";
function configureTab(){
    microsoftTeams.initialize();
            microsoftTeams.appInitialization.notifySuccess();
            microsoftTeams.settings.registerOnSaveHandler(function (saveEvent) {
                const settings = {
                    entityID: "Side Panel App",
                    contentUrl: `${window.location.origin}/podetails`,
                    suggestedTabName: "Purchase Order Summary",
                    websiteUrl: `${window.location.origin}/podetails`,
                };
                microsoftTeams.settings.setSettings(settings);
                saveEvent.notifySuccess();
            });
            microsoftTeams.settings.setValidityState(true);
}
configureTab();
export const Configure = () => {
    
    return (
    <div>
    <Form>
      <Text content="Supplier Collaboration" size="large" />
      <Text content="Press save to continue" size="large" />
      </Form>
        </div>
    )
}