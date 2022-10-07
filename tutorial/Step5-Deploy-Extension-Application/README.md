## Build and Deployment of SAP BTP Extension Application.

Let us clone the codebase and deploy the extension application. 

1. Clone this [GitHub](https://github.com/SAP-samples/btp-msteams-s4-suppliercollab) Repository.

    Before deployment to the SAP BTP environment, please make sure that you created an **XSUAA instance** in your BTP subaccount as described as mentioned under **XSUAA Instance** in Section **Step 1 - Configure SAP BTP**.

    Otherwise, the deployment will fail due to the missing binding. In case you changed the name of your XSUAA instance from **wftaskdec-uaa-service** to something else, please adjust the **manifest.yml** file in the deploy folder of this project. 


2. Update manifest.yml and vars.yml files.
   Go to the deploy folder and make sure you fill the sample files in the **deploy** folder and remove the **sample** file extension before you push the app. 

    Rename the manifest.yml.sample to manifest.yml 
    Rename the vars.yml.sample to vars.yml

3. Update the environment variables in vars.yml as shown below.

    ```

    Provide your environment variables in:
    /deploy/vars.yml
    ```

    ### Environment variables
    The following environment variables need to be set before you deploy the application to SAP BTP or upload it to your MS Teams environment.

    **/deploy/vars.yaml**

    | key    | value    |
    | --------|---------|
    |**SCENARIO**| For S/4HANA  on-premise, the value is "onpremise" and for S/4HANA on Azure Private Cloud, use the value "azureprivatecloud". Please follow the below steps to configure additional settings needed for S/4HANA running on [Azure-Private-Cloud](../Private-Link-Service/README.md)  |
    |**BTP_LANDSCAPE**|The region of your BTP subaccount e.g. eu20|
    |**BTP_ACCOUNT_NAME**|The subdomain of your BTP subaccount|
    |**XSUAA_CS_URL_SUFFIX**|The audience which can be extracted from the metadata (https://.authentication./saml/metadata) of your BTP subaccount e.g. azure-live-eu20 or aws-live-eu10|
    |**BTP_SCOPES**|The full name of the custom scope created in Step 2 Configure-Azure from api:// to /access_as_user|
    |**CONNECTION_NAME_GRAPH**|The name of the Graph connection creates in Step 2 Configure-Azure e.g. GraphConnection|
    |**CONNECTION_NAME_BTP**|The name of the BTP connection creates in Step 2 Configure-Azure e.g. BTPConnection|
    |**MICROSOFT_BLOB_CONTAINER_NAME**|The respective values copied in Step 2 - Configure-Azure|
    |**MICROSOFT_BLOB_CONNECTION_STRING**|The respective values copied in Step 2 - Configure-Azure|
    |**DOMAIN**| The CF domain of your MS Teams extension application e.g. btp-s4-msteams-suppliercollab.cfapps.eu20.hana.ondemand.com |
    |**MICROSOFT_APP_ID**| The Application Client Id of your Azure AD App Registraiton |
    |**MICROSOFT_APP_PASSWORD**|A Client Secret which you created for your Azure AD App Registration|
    |**MICROSOFT_AD_TENANT_ID**|The unique Id of your Azure Active Directory|
    |**TEAMS_APP_EXTERNAL_ID**|The external AppId of the Teams App

**Note :** Generate the GUID from command prompt using window PowerShell by invoking the command [guid]:: NewGUID() as shown below and pass this value to the paramenter **TEAMS_APP_EXTERNAL_ID**. The same value  can be passed to the **msteamsappguid-placeholder** in manifest.json **(Step 7)** 

![plot](./images/guid.png) 

4. Open the manifest.yml file to update the application name. This application name needs to be updated in App Registration Configuration in Microsoft Azure.

    ```console
    Provide your application name in:
    /deploy/manifest.yml
    ```
5. Build and deploy.
    Once you're ready, please execute the following steps manually or by running the respective npm command.

    a) Build your server application

    ```console
    npm run  build-deploy
    ```

    b) Login to your Cloud Foundry subaccount, which you would like to deploy to

    ```
    cf login -a `<CF API endpoint e.g. https://api.cf.region.hana.ondemand.com/>`
    ```

    c) Push the application to your dedicated subaccount

    ```
    cd deploy
    cf push -f manifest.yml --vars-file vars.yml
    ```

    Once the application is deployed, note down the Extension Application URL as shown below
    ![plot](./images/deploy.png) 

    You can also check the status of your application in your SAP BTP Cockpit.
    ![plot](./images/SAPBTPCockpit.png) 

<br>

7. Microsoft Teams manifest upload.

    In this step, you will upload the manifest definition of the extension application to Microsoft Teams.

    Go to project folder and then navigate to folder deploy->msteamsfiles. Rename manifest.json.sample and remove the .sample. 
    In your manifest.json file, the below parameters need to be updated.<br>

    Use the generated GUID in **Step 3** and update the manifest.json file with the below parameter before you upload the manifest definition of your extension app to Microsoft Teams.

    **/deploy/msteamsfiles/mainfest.json**
    | key    | value    |
    | --------|---------|
    |**msteamsappguid-placeholder**|A unique GUID for the MS Teams App which you have generated just now. This GUID is for the MS Teams environment and does not equal the Application Registration Client Id.|
    |**msappid-placeholder**|Azure App Registration Client ID of your extension application.|
    |**domain-placeholder:**|The CF domain of your MS Teams extension.|

    Your manifest.json file should reflect the below changes
    ![plot](./images/manifest1.png) 

    ![plot](./images/manifest2.png) 

    Once you have the configuration parameters updated, you must zip all files in the /deploy/msteamsfiles folder.
    ![plot](./images/zipfilecontent.png) 

    Now, we need to upload this to Microsoft Teams Admin Center(https://admin.teams.microsoft.com/). Login with an Active Directory user who has a Microsoft Teams Administrator role assigned.

    Use the menu as shown below to upload your app.
    ![plot](./images/admincenter.png) 

    Once the upload is successful, you should be able to see the extension application in the Build for your org Section within Microsoft Teams, as shown below.<br>
    Login to https://teams.microsoft.com and check the App Store.
    ![plot](./images/installapp.png) 


    ## Post Deployment Steps

8.  Go to SAP BTP Cockpit. Go to the Subaccount - Services - Instances and Subscriptions. Click on the XSUAA's instance which you are using in this application. Open the service key and get the Credetials details(clientid, clientsecret and url) as mentioned in below screenshot.
    ![plot](./images/servicekey01.png) 

    Now Click on the instance for Event Mesh. As this is executed in a trial environment, you will see the plan as a dev for SAP Event Mesh Service.
    ![plot](./images/btpcockpit-instances.png)


    With this following information create webhook as shown below:

    | key    | value    |
    | --------|---------|
    |Queue Name| Give any name eg. PRApproval|
    |Quality Of Service| 1|
    |Webhook URL| 'https://'+ Extension Application URL from **(Step 5)**+'/em/po-attention '|
    |Exempt Handshake| yes|
    |Authentication| select **OAuth2ClientCredentials**|
    |Client ID| clientid from **(Step 8)**|
    |Client Secret|clientsecret from **(Step 8)**|
    |Token URL |url from **(Step 8)** + 'oauth/token'|


    ![plot](./images/em-webhook01.png)

    If the subscription status is paused, then click on resume subscription.

    This completes the deployment of the SAP BTP Extension application and the webhook configuration. 
    Now, let us go ahead and test the application.
