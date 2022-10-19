## Test the application

Now that you have successfully deployed the Extension application to SAP BTP and uploaded the application manifest  Microsoft Teams Admin Center in the previous steps let us go ahead and test the application.

1. Log in to SAP BTP Cockpit and check your MS teams extension application that you have deployed to SAP BTP in the previous step5 tutorial. It should be in started state.
![plot](./images/appstarted.png)

2. Log in to Microsoft Teams as SCM Operations manager (user who interacts with the supplier for Purchase Order fulfilment).

3. Install the custom app by following the below steps.

![plot](./images/installapp.png)

4. Select the application and add the application.

![plot](./images/addapp.png)

5. Once the app has been added, you should be able to see the below in your MS Teams with the below Welcome message.

![plot](./images/launch.png)

The Supplier Collaboration BOT supports 2 scenarios.

### Scenario1 - Pending Supplier Confirmations

1. You will receive the notification for Pending Supplier Confirmations everyday at the scheduled time or if you want immediate notifications of purchase orders with pending supplier confirmations you can login to SAP S/4HANA system and run the "ZPEND_SUPPL_CONF_EMSEND_JOB" using the SE38 transaction.

![plot](./images/runjob.png)

2. Once you receive the notification of purchase orders with pending supplier confirmations, click on the corresponding "Select" button of the respective purchase order to view the details.

![plot](./images/popending.png)

3. Click the "Yes" button in the purchase order details notification to start the scheduling  of meeting.

![plot](./images/s1podetails.png)

4. Click the "Schedule" button in the Meeting popup to schedule the meeting with the supplier.

![plot](./images/s1schedulemeeting.png)

5. The application displays the popup once the meeting is scheduled successfully.

![plot](./images/s1schedulesuccess.png)

6. Join the meeting with the Supplier using Microsoft Teams

![plot](./images/s1joinmeeting.png)

7. Open the in-meeting application to view the purchase order Details.

![plot](./images/inmeetingapp.png)

8. Query the Purchase Order Item details by clicking the "Search Order" button in the in meeting application.

![plot](./images/inmeetingposearch.png)

9. Edit the Supplier Confirmation details by click the "Edit button" of the respective supplier confirmation.

![plot](./images/posupconfirmedit.png)

10. Update the details like quantity and delivery date of the supplier confirmation to SAP S/4HANA system from the in-meeting application by click the save button.

![plot](./images/posupconfirmsave.png)

11. You can also create new supplier confirmations and delete the existing supplier confirmations using the in-meeting aplication.

Congratulations - You have updated the supplier confirmations to SAP S/4HANA system successfully.

### Scenario2 - Query Un-fulfilled Purchase Orders

1. Query the Purchase Order details by entering the PO number in the Supplier Collaboration BOT.

![plot](./images/s2querypo.png)

2. Select the Purchase Order Item by clicking the respective "Select" button to view the details.

![plot](./images/s2selectpoitem.png)

3. The BOT displays the selected PO Item details.

![plot](./images/s2poitemdetails.png)

4. Schedule the meeting with the supplier by clicking the "Yes" button in the above purchase order details message.

![plot](./images/s2schedulemeeting.png)

5. Collaborate with the supplier by following the above scenario 1 steps from step 5 to step 11.

Congratulations! You have completed the end-to-end Supplier Collaboration scenario with Microsoft Teams and SAP S/4HANA.

**Note :**  
1. The Purchase Order in-meeting app is only available in the Desktop Client of the Teams app and not the Browser version. 
2. The feature to add/invite someone to the meeting is under development. 

### Troubleshooting

1. To access MS Teams admin URL, make sure the test user has Teams Administrator Role Assignment. This is also required to upload the application in MS Teams Admin console.

2. Add Microsoft Teams Exploratory license to the test user, especially the Exchange Online (Plan 1) License without which some resources like https://graph.microsoft.com/v1.0/me/calendar will not be available with graph api. 

3. Ensure you import GitHub certificate by following [abapGit documentation](https://docs.abapgit.org/guide-ssl-setup.html) before executing Step 33 in [Step3-Configure-SAP-S4HANA](../Step3-Configure-SAP-S4HANA/README.md) to avoid SSL certificate errors.

4. In SAP S/4HANA 2020 and higher versions, the Clone Repository is not present in Abap Git program. On creating the online repository, a local copy is created automatically. So, the Clone Online Repo step can be avoided in these systems and Pull step can be executed directly. 

5. In case of Unauthorized error in Webhook, make sure that the role created by uaa instance is added to the Role Collection mapped in the Trust config. If this also does not solve the Issue the Role Collection should be added to the user. 

6. In case of Unauthorized error in destination configuration, Principal Type can be changed to X.509 Certificate (Strict Usage) in cloud configuration. 

7. If service binding ZSB_PO_CONF is corrupted and the pull command in AbapGit fails, create a new service binding and update the URL in [S4Client.js](../../server/services/S4Client.js).

8. In the Azure BOT Service, make sure to pass all the scopes while adding the Graph Connection to prevent issue of 403-Forbidden Error. When we test the connection, we have to test with Test User and provide all the permissions for the user.

