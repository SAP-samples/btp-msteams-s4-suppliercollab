## Configure SAP S/4HANA On-Premise System
In this section, you will create an OData service based on the SAP RAP framework to read, create, update & delete the Purchase order supplier confirmations. Then we will create a background job that reads all the pending supplier confirmations & send them to the event mesh. After this step, the event mesh webhook subscription will send the Team's user a message with all the Purchase orders with pending supplier confirmations.

### Prerequisites
Moderate knowledge of SAP ABAP, RAP framework, assigning user roles, navigating through SAP & developer authorizations assigned to your SAP S/4HANA user id.

### SAP RAP based OData service for Purchase Order Supplier Confirmation
In this step, you will create(import the git repo) an OData service using the RAP framework for reading, creating, updating & deleting the supplier confirmations.

>Note: We created this odata service as no standard odata service exists at the time of this git repository creation for SAP S/4HANA 2020

#### <ins> Import ABAP Git Project to run <ins>
Use the below git URL (ABAP branch) to import the ABAP package, which has the code for the RAP OData service and the background job (which will be discussed in the upcoming steps).

1.  Open **SE38** and execute the program **ZABAPGIT_STANDALONE**.<br>
    >Note: If the above program is not there in the system, use the below link to install ABAP Git<br>
    https://docs.abapgit.org/guide-install.html

2.  Click the **New Online** button to import the repository.<br>
![Import Repo](./images/1.png)

3. Enter the git repository URL, package & branch as **ABAP** and click **Create Online Repo** to import the repository.<br>
![Repo details](./images/2.png)

4. Select **Clone Online Repo** and click **pull** to save the repo to your SAP S/4HANA system.<br>
    >Note: For more information, please follow the official ABAP Git tutorial below:<br>
    https://docs.abapgit.org/guide-online-install.html

#### <ins> Understanding the generated artifacts & code<ins>

After installing the git repository, different artifacts will be created in your package like the CDS view, behavior definitions, service bindings, etc.; let's understand them in detail.
>Note: You should use eclipse with ABAP plugins installed to do the next steps.

5. Open the CDS view **ZI_PO_CONF** in eclipse, which is used to fetch all the supplier confirmations for Purchase Orders.
![CDS View](./images/3.png)

6. **ZI_PO_CONF** is the behavior definition that provides the service's Create, Update & Delete capabilities. We are using unmanaged save, to call a function module to save the supplier confirmations.
![Behavior definition](./images/4.png)

7. The class **zbp_i_po_conf** is linked to the behavior definition and has the code to handle the create, update & delete (CUD) operations. Navigate to the **Local Types** to find the code.
![Local class](./images/5.png)

8. **save_modified** method is overrided to handle the CUD operations. In this method, we call the function module **ME_PO_CONFIRM** to save the supplier confirmations.
![Local class](./images/5.png)
    >Note: Use this function module with caution as this is not a released function module

9. Now activate the service by clicking the **Publish** button.
![Local class](./images/6.png)

Now you have the service which will be used in the upcoming chapters to read, create, update & delete the supplier confirmations from the extension application deployed in SAP BTP.

### Background Job to send the Workflow Instances to the Event mesh

In this step, you will create the background job to send the purchase orders with pending supplier confirmations to the event mesh. After this step, the event mesh subscription will forward them to the Teams application for the action.

#### <ins> Create the service key for your Event Mesh <ins>
In this sub-step, you will create a service key for your Event Mesh instance, which has the OAuth client credentials and the rest service URL to communicate with the Event Mesh.

10. Go to your SAP BTP subaccount and select **Instances and Subscriptions**.<br>
![Ins & Subs](./images/11.png)

11. Click the **Three dot Button** to open the menu and click **Create Service Key** to create the service key.<br>
![Ins & Subs](./images/12.png)

12. Provide a name and click **Create** to create the service key.<br>
![Ins & Subs](./images/13.png)

13. Click **View** to open the **Service Key**.<br>
![View Service Key](./images/14.png)

14. Scroll down to the **httprest** protocol and note the **Clientid**, **Clientsecret, **tokenendpoint**, and URI**, which you will use in the upcoming steps.<br>
![Note the service key details](./images/15.png)

#### <ins>Create the Destination<ins>
In this sub-step, you will create a destination to maintain the rest URL of the event mesh to connect and send messages.

15. Goto **SM59** transaction and click **create** icon as shown in the below screenshot to create a new destination.<br>
![Destination](./images/s4/16.png)

16. Provide a unique name for the destination and select the **Connection Type** as **G HTTP Connection to external server**.<br>
![Destination](./images/s4/17.png)

17. Copy the **URI** from **Step 21** and paste it in **Host** input box and use **443** as the port.<br>
![Destination](./images/s4/18.png)
    >Note: Host should not have **https** while pasting in the **uri**

18. Select the **Active** radio button for **SSL** in the section **Logon & Security** and **SSL Client(Anonymous)** in **SSL Certificate** and click **Save**.<br>
![Destination](./images/s4/19.png)

19. Click **Connection Test** to check if the connection to Event Mesh is established successfully.<br>
![Connection Button](./images/s4/20.png)
![Connection Result](./images/s4/21.png)

#### <ins> Configure the oAuth profile <ins>
In this sub-step, you will configure the OAuth client, which will be used by the destination from **Step 22** to connect to Event Mesh.<br>

20. Open transaction **OA2C_CONFIG**, which will open a web application in your browser, and click **Create** to create an OAuth client.<br>
![OAuth Create](./images/s4/22.png)

21. Select the drop down value **/IWXBE/MGW_MQTT** in the field **OAuth 2.0 Client Profile**, enter a unique name in the **Configuration Name** and **OAuth 2.0 Client ID** value from **Step 21** : **Clientid**.<br>
![OAuth Client Details](./images/s4/23.png)

22. Scroll down and enter **clientsecret** and **tokenendpoint** from **Step 21**.<br>
![Additiona details](./images/s4/24.png)

22. Select the radio buttons **Form Fields**, **Header Field** and **Client Credentials** as shown in the screenshot.<br>
![Additiona details](./images/s4/25.png)

23. **Save** it.<br>
![Save OAuth](./images/s4/26.png)

#### <ins>Understanding the Code<ins>
Now that you have imported the code to push the workitems to the Event Mesh. Let's understand how it works.

37. After completing the **Step 36**, you will have a report **ZWFCUSEMSEND_TEAMSINT** and a class **zcl_wfcusemsend_teamsint** created in your SAP S/4HANA system.<br>

38. Report: **ZWFCUSEMSEND_TEAMSINT** will run and execute the class **zcl_wfcusemsend_teamsint** method **RUN_EM_JOB**. The last 1-minute timestamp will be sent as the importing parameter to the method **RUN_EM_JOB**, which will be used to fetch the workitems that were created in the last 1 minute of the report's execution( called from the background job, which is described in the upcoming steps).<br>
![Report](./images/s4/30.png)

39. Inside the method: **RUN_EM_JOB**, the private method: **GET_DELTA_WORKFLOW_INSTANCES** will be called to fetch all the workflow instances (workitems) that were created. The task **TS02000714** is from **Step 15**.<br>
![Task Fetch](./images/s4/34.png)

40. After the execution of the method: **GET_DELTA_WORKFLOW_INSTANCES**, the method: **CONNECT_TO_EM** will create the HTTP connection instance to the Event Mesh, which is well explained using the comments in the code.<br>
![Execution](./images/s4/36.png)
You will also maintain the URI for the Event mesh in the **CONNECT_TO_EM** method as shown below:<br>
![Execution](./images/s4/52.png)

41. Then the **SEND_WORKITEM_TO_EM** method will send the Purchase Requisition workitem to the Event Mesh.<br>
![Constructor](./images/s4/35.png)
    >**Note**: The Destination, OAuth Profile & OAuth Configuration are maintained in the **Contructor** method.

#### <ins>Background Job Creation<ins>
In this step, you will automate the report from **Step 37** to run in the background every minute to send the newly created workitems to the Event Mesh.

42. Open the Transaction **SM36** and click **Job Wizard** to create a new background job.<br>
![SM36](./images/s4/37.png)

43. Click **Continue**.<br>
![SM36 Step 2](./images/s4/38.png)

44. Enter a unique name in **Job Name** input box and click **Continue**.<br>
![SM36 Step 3](./images/s4/39.png)

45. Select **ABAP Program Step** and click **Continue**.<br>
![SM36 Step 4](./images/s4/40.png)

46. Enter the report name from **Step 37** and click **Continue**.<br>
![SM36 Step 5](./images/s4/41.png)

47. click **Continue**.<br>
![SM36 Step 6](./images/s4/42.png)

48. Select the radio button **Immediately** and click **Continue**.<br>
![SM36 Step 7](./images/s4/43.png)

49. Select the check box **Period** as show in the screenshot.<br>
![SM36 Step 8](./images/s4/44.png)

50. Now select **None of the above** and click **Other Periods** button.<br>
![SM36 Step 9](./images/s4/45.png)

51. Enter **1** in **Minute(s)** input box, so the background job will run for every 1 minute and click **Create** and then click **Continue**.<br>
![SM36 Step 10](./images/s4/46.png)

52. Click **Complete** to schedule the background job.<br>
![SM36 Step 11](./images/s4/47.png)

You have now completed the creation of the background job that will send the newly created workitems to the Event Mesh every 1 minute.

### Testing: From Creation of PR to verifying the message in Event Mesh
Let's create a new Purchase Requisition and go to Event Mesh to see the message details.

53. Repeat the **Steps 12 - 14** to create a new Purchase Requisition and initiate a new Approval workflow. The background job will send the workitem information to the Event Mesh Queue in a minute.

54. Open the Event Mesh application from your subaccount.<br>
![Message Client](./images/s4/48.png)

55. Go to the Message Client you have created and go to the **Test** tab to consume the message.<br>
![Message Client](./images/s4/49.png)

56. Select your Queue from the dropdown to see the messages sent to Queue.<br>
![Queue](./images/s4/50.png)

57. Click on **Consume** to see the message.<br>
![Consume](./images/s4/51.png)

Congratulations!! Now you have completed the creation of the new Flexible workflow for the Purchase Requisition, configured the background job to send the workitems to Event Mesh, and tested it successfully.