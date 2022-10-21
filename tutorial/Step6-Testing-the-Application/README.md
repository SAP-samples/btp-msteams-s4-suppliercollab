## Test the Extension Application

Now that you have successfully deployed the extension application in SAP BTP and uploaded the teams application in Microsoft Teams Admin Center, follow these steps to test the application.

1. Log in to SAP BTP cockpit, navigate to your subaccount and choose **Cloud Foundry** > **Spaces** and select your space.

2. You will see the deployed application under **Application**. Choose your application to view the details. It should be in **Started** state.
    
    ![plot](./images/appstarted.png)

2. Log in to [Microsoft Teams](https://teams.microsoft.com) as SCM Operations manager (a user who interacts with the supplier for Purchase Order fulfilment).

3. In Microsoft Teams, choose **Apps** > **Built for your org**. You will be able to see your application in the detail page. In case you do not see your application, check the manifest file uploaded in Microsoft Teams Admin Center.

    ![plot](./images/installapp.png)

4. Select the application and choose **Add**.

    ![plot](./images/addapp.png)

5. Once the application has been added, you should be able to see a welcome message in Microsoft Teams.

    ![plot](./images/launch.png)


The Supplier Collaboration BOT supports 2 scenarios.

### Scenario 1 - Daily Pending Supplier Confirmations Notifications

1. You will receive the notification for Pending Supplier Confirmations everyday at the scheduled time or if you want immediate notifications of purchase orders with pending supplier confirmations you can login to SAP S/4HANA system and run the report **ZPEND_SUPPL_CONF_EMSEND_JOB**.

    ![plot](./images/runjob.png)

2. Once you receive the notification of purchase orders with pending supplier confirmations, choose **Select** to view the details of the respective purchase order.

    ![plot](./images/popending.png)

3. Choose **Yes** to schedule the meeting with the supplier.

    ![plot](./images/s1podetails.png)

4. Choose **Schedule** to confirm.

    ![plot](./images/s1schedulemeeting.png)

5. You will recieve a success message popup after the meeting is scheduled.

    ![plot](./images/s1schedulesuccess.png)

6. Join the meeting with the supplier using Microsoft Teams.

    ![plot](./images/s1joinmeeting.png)

7. Open the in-meeting application to view the purchase order details.

    ![plot](./images/inmeetingapp.png)

8. Choose **Search Order** to query the purchase order item details.

    ![plot](./images/inmeetingposearch.png)

9. Choose **Edit** to update the data.

    ![plot](./images/posupconfirmedit.png)

10. Update **Quantity** and **Delivery Date of the Supplier Confirmation** and choose **Save**.

    ![plot](./images/posupconfirmsave.png)

Congratulations - You have updated the supplier confirmations to SAP S/4HANA system successfully.

### Scenario 2 - Query Unfulfilled Purchase Orders

1. Query the purchase order details by entering the number in the Supplier Collaboration BOT.

    ![plot](./images/s2querypo.png)

2. Choose **Select** to view the details of the purchase order Item.

    ![plot](./images/s2selectpoitem.png)

3. The BOT will display the selected PO Item details.

    ![plot](./images/s2poitemdetails.png)

4. Repeat the steps 3 - 10 from **Scenario 1 - Daily Pending Supplier Confirmations Notifications** section.

You have completed the end-to-end supplier collaboration scenario with Microsoft Teams and SAP S/4HANA.

**Note :**  
1. The Purchase Order in-meeting application is only available in the desktop client of the Teams app and not in the browser version. 
2. The feature to add or invite someone to the meeting is under development. 

### Troubleshooting

1. To access Microsoft Teams admin URL, make sure the test user has the Teams Administrator role assigned. This is also required to upload the teams application in Microsoft Teams Admin Center.

2. Add Microsoft Teams Exploratory license to the test user, especially the Exchange Online (Plan 1) License without which some resources like **https://graph.microsoft.com/v1.0/me/calendar** will not be available in Microsoft Graph API. 

3. Make sure you import the GitHub certificate by following the [abapGit documentation](https://docs.abapgit.org/guide-ssl-setup.html) before executing step 4 of the **6. Import the ABAP Git Project** section in [Step3-Configure-SAP-S4HANA](../Step3-Configure-SAP-S4HANA/README.md) to avoid SSL certificate errors.

4. In SAP S/4HANA 2020 or higher, the **Clone Repository** option is not available in the ABAP Git program. When creating an online repository, a local copy is created automatically. Hence, the step 4 of the **6. Import the ABAP Git Project** section in [Step3-Configure-SAP-S4HANA](../Step3-Configure-SAP-S4HANA/README.md) can be avoided and **Pull** can be executed directly.

5. In case you get an **Unauthorized** error in the destination configuration, you have to change the principal propagation type to **X.509 Certificate (Strict Usage)** in the Cloud Connector. 

6. In the Azure Bot Service, make sure to pass all the scopes while adding the Graph Connection to prevent the **403 Forbidden** error from happening. When you test the connection, you have to test it with a test user and provide all the permissions for this user.

7. If the service binding: **ZSB_PO_CONF** is corrupted and the pull command in abapGit fails, create a new service binding and update the URL in [S4Client.js](../../server/services/S4Client.js).
