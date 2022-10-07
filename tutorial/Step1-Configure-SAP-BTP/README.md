## Configure SAP Business Technology Platform
To get started with end-to-end implementation, we will need to perform the below configurations and deployments in different systems.


## Setup the SAP BTP Subaccount and Initial configurations

Based on your SAP BTP Subscription, you can get started with the setup and configuration. In case you want to use new trial accounts, please refer to the this tutorial 
Tutorial to create a new trial account ( https://developers.sap.com/tutorials/hcp-create-trial-account.html )

Note: You should be a Global Account Administrator to perform the below steps.
You can use an existing subaccount / can create a new subaccount. 

If you are new to SAP BTP, follow this tutorial to setup SAP BTP and assign entitlements
https://developers.sap.com/group.scp-1-get-ready.html

1. Log in to SAP BTP cockpit as Global Account Administrator, navigate to your global account and create a subaccount.
2. Assign the following entitlements.

Service | Plan | Usage Scenario |
--- | --- | --- |
Cloud Foundry Runtime | MEMORY | Needed to run the application on SAP BTP, Cloud Foundry runtime. The chosen quota defines the available amount of GB memory.|
Authorization and Trust Management Service | application | This service is required to authenticate access to the extension app's notification endpoint.|
Destination Service | lite | Destination service lets you find the destination information required to access a remote service or system from your Cloud Foundry application.|
Connectivity Service | lite | Connectivity service to connect extension application to an on-premise system through the Cloud Connector.|
Event Mesh | default | Messaging bus for inter-app communication within the Cloud Foundry environment.|

### Setup Event Mesh
Set up SAP Event Mesh and test a sample application. Follow [SAP Event Mesh](https://developers.sap.com/group.cp-enterprisemessaging-get-started.html) tutorial to get started.
1. Navigate to your subaccount and choose Services -> Instances and Subscriptions
2. Open the SAP Event Mesh application. 
3. Choose Message Clients and click on Create Queue to create your message client queue.
4. Create queue with name "POConfirmations" as shown in the below screenshot.

![plot](./images/em-create-queue.png)


 
### XSUAA Service Configuration
Create a new [XSUAA](https://help.sap.com/docs/CP_AUTHORIZ_TRUST_MNG) instance in your dedicated SAP BTP subaccount. This XSUAA instance is required to authenticate access to the extension app's notification endpoint.

```
Name: wftaskdec-uaa-service
Service: Authorization and Trust Management Service (xsuaa)
Plan: application
```
![plot](./images/btp-uaa-service.png)

Click on Next and enter the following configuration parameters and click on "Create".

    {
        "xsappname": "teamspoapp",
        "tenant-mode": "dedicated",
        "description": "Security profile for Microsoft Teams extension",
        "scopes": [
            {
                "name": "uaa.user",
                "description": "UAA"
            }
        ],
        "role-templates": [
            {
                "name": "Token_Exchange",
                "description": "UAA",
                "scope-references": [
                    "uaa.user"
                ]
            }
        ]
    }

![plot](./images/btp-uaa-config.png)

### Destination Service Configuration
Create a new [Destination](https://help.sap.com/docs/CP_CONNECTIVITY) instance in your dedicated SAP BTP subaccount. This Destination instance lets you find the destination information required to access a remote service or system from your Cloud Foundry application.

```
Name : wftaskdec-dest-service
plan : lite
```

![plot](./images/btp-dest-instance.png)

For the connection to an on-premise SAP S/4HANA system, you can optionally use this service, together with (i.e. in addition to) the Connectivity service, see Consuming the Connectivity Service.


### Connectivity Service Configuration
Create a new [Connectivity](https://help.sap.com/docs/CP_CONNECTIVITY) instance in your dedicated SAP BTP subaccount. This Connectivity instance lets you connect your Node.js extension application to an on-premise system through the SAP Cloud Connector. To achieve this, you must provide the required information about the target system (destination) and set up an HTTP proxy that lets your application access the on-premise system.

```
Name: wftaskdec-conn-service
plan: lite
```
![plot](./images/btp-conn-instance.png)

-> Note: If you change the names of XSUAA/Destination/Connectivity instances, please also adjust the manifest.yml file within your MS Teams extension project. This ensures the correct binding of the respective instances to your extension app. 
