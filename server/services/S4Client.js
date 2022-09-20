import core from '@sap-cloud-sdk/core'
import xsenv from '@sap/xsenv'

import AuthClient from "./AuthClient.js";

xsenv.loadEnv();
const sDestinationName = 'S4HANA_PP';


function formatDate(date){
    const selDate = new Date(date);
    const year = selDate.getFullYear();
    const month = selDate.getMonth() + 1; // + 1 because 0 indicates the first Month of the Year.
    const day = selDate.getDate();
    return `${year}-${month}-${day}T00:00:00`; 
}

const createpoconfirmdetails = async (req, res) => {
    const confirmation = req.body;
    const url =`/sap/opu/odata/sap/ZSB_PO_CONF/Confirmation`
    try{
        const btpToken = await getBTPToken(req);
        const data = {
            Ebeln: confirmation.poId,
            Ebelp: confirmation.poItemId,
            Eindt: formatDate(confirmation.delDateSupConfirmation),
            Menge: confirmation.quantity.toString()
        };
        let response = await executeS4API(url,"post",data,btpToken);
        res.status(201).send(response.data);
    } catch(err){
        res.status(500).send("Error occured");
    }
}

const updatepoconfirmdetails =  async (req, res) => {
    const poId = req.params.poId;
    const itemId = req.params.itemId;
    const seqNo = req.params.seqNo;
    const confirmation = req.body;
    const url =`/sap/opu/odata/sap/ZSB_PO_CONF/Confirmation(Ebeln='${poId}',Ebelp='${itemId}',Etens='${seqNo}')`
    try{
        const btpToken = await getBTPToken(req);
        const data = {
            Ebeln: confirmation.poId,
            Ebelp: confirmation.poItemId,
            Etens: confirmation.seqNumber.toString(),
            Eindt: formatDate(confirmation.delDateSupConfirmation),
            Menge: confirmation.quantity.toString()
        }
        let response = await await executeS4API(url,"put",data,btpToken);
        res.status(204).send("success");
    } catch(err){
        res.status(500).send("Error");
    }
}

const deletepoconfirmdetails =  async (req, res) => {
    const poId = req.params.poId;
    const itemId = req.params.itemId;
    const seqNo = req.params.seqNo;
    const url =`/sap/opu/odata/sap/ZSB_PO_CONF/Confirmation(Ebeln='${poId}',Ebelp='${itemId}',Etens='${seqNo}')`
    try{
        const btpToken = await getBTPToken(req);
        let response = await executeS4API(url,"delete","",btpToken);
        res.status(204).send("success");
    } catch(err){
        res.status(500).send("Error");
    }
}

const fetchpodetails = async (req, res) => {
    const poId = req.params.poId;
    const url =`/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/C_PurchaseOrderTP?$filter=PurchaseOrder eq '${poId}'&$format=json&$expand=to_PurchaseOrderItemTP&$select=PurchasingGroup,Supplier_Text,to_PurchaseOrderItemTP/PurchaseOrderItem`
    try{
        const btpToken = await getBTPToken(req);
        let response = await executeS4API(url,"get","",btpToken);
        res.status(200).send(response.data);
    } catch(err){
        res.status(500).send("Error occured");
    }
    
}

const fetchpoitemdetails = async (req, res) => {
    const poId = req.params.poId;
    const itemId = req.params.itemId;
    const btpToken = await getBTPToken(req);
    const url =`/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/C_PurchaseOrderItemTP?$filter=PurchaseOrder eq '${poId}'&PurchaseOrderItem eq '${itemId}'&$expand=to_PlantValueHelp,to_PurOrdSupplierConfirmation,to_PurchaseOrderTP&$select=PurchaseOrderItem,Material,OrderQuantity,PurchaseOrderQuantityUnit,PurgDocOrderAcknNumber,to_PlantValueHelp/PlantName,PurchaseOrderItemText,to_PurchaseOrderTP/PurchaseOrderDate,to_PurOrdSupplierConfirmation/SupplierConfirmationCategory,to_PurOrdSupplierConfirmation/ConfirmedQuantity,to_PurOrdSupplierConfirmation/DeliveryDate,to_PurOrdSupplierConfirmation/ExternalReferenceDocumentID,to_PurOrdSupplierConfirmation/SequentialNmbrOfSuplrConf`
    try{
    let response = await executeS4API(url,"get","",btpToken);
        if(response.data){
            let poItemDetails = response.data.d.results;
            poItemDetails = poItemDetails.filter(poItem => poItem.PurchaseOrderItem === itemId);
            const result = {
                d:{
                    results:poItemDetails
                }
            }
            res.status(200).send(result);
        }
    } catch(err){
        res.status(500).send("Error");
    }
}

async function getBTPToken(req){
    const authHeader = req.headers.authorization;
    const authClient = new AuthClient();
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', token);
        console.log(btpOAuthToken);
        return btpOAuthToken;
    } else {
        throw new Error('Missing authorization header');
    }
}

async function executeS4API(url, httpMethod, data, btpToken){
    const scenario = process.env.SCENARIO;
    let response;
    if (scenario === "azureprivatecloud") {
        console.log("executing using private cloud");
        response = await executeS4APIUsingPrivateLink(url, httpMethod, data, btpToken);
    } else {
        console.log("executing using cloud connector");
        if(httpMethod === "get"){
            response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
                method: httpMethod,
                url: url
            },{ fetchCsrfToken: false });
        } else {
            response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
                method: httpMethod,
                url: url,
                data: data,
                headers: {
                    'content-type': 'application/json'
                }
            },{ fetchCsrfToken: true });
        }
    }
    return response;
}

async function executeS4APIUsingPrivateLink(url, httpMethod, data, jwtToken) {
    try {
      //get destination url from vcap
      const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
      const s4oauthDestConfigUrl = VCAP_SERVICES.destination[0].credentials.uri + "/destination-configuration/v1/destinations/s4oauth";
      //fetch accesstoken for SAML principal propagation
      const authClient = new AuthClient();
      const destinationDetails = await authClient.getDestinationDetails(VCAP_SERVICES.destination[0].credentials, "s4BasicAuth");
      const samlConfiguration = await authClient.getSamlDestinationConfiguration(s4oauthDestConfigUrl, jwtToken);
      const finalBearerToken = await authClient.getBearerForSAML(destinationDetails, samlConfiguration);
      const finalDestinationDetails = await authClient.getDestinationDetails(VCAP_SERVICES.destination[0].credentials, "s4NoAuth");
      let response = await callS4APIUsingPrivateLink(finalDestinationDetails, finalBearerToken, url, httpMethod, data);
      return response;
    }
    catch (err) {
      console.log("Test Message error " + err);
      throw err;
    }
}

async function callS4APIUsingPrivateLink(finalDestinationDetails, finalBearerToken, url, httpMethod, data) {
    //fetch csrf token
    let res;
    let csrfToken;
    let cookie;
    const destinationConfiguration = finalDestinationDetails.destinationConfiguration;
    const xcsrfUrl = destinationConfiguration.URL + url;
    let finalHeaders = {
        'Authorization': `Bearer ${finalBearerToken}`
    }
    if(!httpMethod.equals("get")){
    //fetch csrf token for post/patch/delete methods
        try {
            res = await axios.get(xcsrfUrl,
                {
                headers: {
                    'Authorization': `Bearer ${finalBearerToken}`,
                    'x-csrf-token': 'fetch'
                }
                }
            );
            csrfToken = res.headers['x-csrf-token'];
            cookie = res.headers['set-cookie'].join("; ");
        } catch (err) {
            csrfToken = err.response.headers['x-csrf-token'];
            cookie = err.response.headers['set-cookie'].join("; ");
            console.log("err while fetching xcsrftoken is :  " + err);
        }
        finalHeaders = {
            'Authorization': `Bearer ${finalBearerToken}`,
            'x-csrf-token': csrfToken,
            'Cookie': cookie
        }
    }
    //call final API
    try {
      let response = await axios({
        method: httpMethod,
        url: url,
        headers: finalHeaders,
        data: data
      })
      return response;
    } catch (err) {
      console.log("err while calling S4API is : " + err);
      throw err;
    }
  }

export {
    createpoconfirmdetails,
    updatepoconfirmdetails,
    deletepoconfirmdetails,
    fetchpodetails,
    fetchpoitemdetails,
    executeS4API
}