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
        let response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
            method: 'POST',
            url: url,
            data: {
                Ebeln: confirmation.poId,
                Ebelp: confirmation.poItemId,
                Eindt: formatDate(confirmation.delDateSupConfirmation),
                Menge: confirmation.quantity.toString()
            },
            headers: {
                'content-type': 'application/json'
            }
        },{ fetchCsrfToken: true }
        ); 
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
        let response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
                method: 'PUT',
                url: url,
                data: {
                    Ebeln: confirmation.poId,
                    Ebelp: confirmation.poItemId,
                    Etens: confirmation.seqNumber.toString(),
                    Eindt: formatDate(confirmation.delDateSupConfirmation),
                    Menge: confirmation.quantity.toString()
                },
                headers: {
                    'content-type': 'application/json'
                }
            },{ fetchCsrfToken: true }
            );
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
        let response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
            method: 'DELETE',
            url: url
        },{ fetchCsrfToken: true });
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
        let response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
            method: 'GET',
            url: url
        });
        res.status(200).send(response.data);
    } catch(err){
        res.status(500).send("Error occured");
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

const fetchpoitemdetails = async (req, res) => {
    const poId = req.params.poId;
    const itemId = req.params.itemId;
    const btpToken = await getBTPToken(req);
    const url =`/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/C_PurchaseOrderItemTP?$filter=PurchaseOrder eq '${poId}'&PurchaseOrderItem eq '${itemId}'&$expand=to_PlantValueHelp,to_PurOrdSupplierConfirmation,to_PurchaseOrderTP&$select=PurchaseOrderItem,Material,OrderQuantity,PurchaseOrderQuantityUnit,PurgDocOrderAcknNumber,to_PlantValueHelp/PlantName,PurchaseOrderItemText,to_PurchaseOrderTP/PurchaseOrderDate,to_PurOrdSupplierConfirmation/SupplierConfirmationCategory,to_PurOrdSupplierConfirmation/ConfirmedQuantity,to_PurOrdSupplierConfirmation/DeliveryDate,to_PurOrdSupplierConfirmation/ExternalReferenceDocumentID,to_PurOrdSupplierConfirmation/SequentialNmbrOfSuplrConf`
    try{
    let response = await core.executeHttpRequest({ destinationName: sDestinationName,jwt: btpToken}, {
        method: 'GET',
        url: url
    });
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

export {
    createpoconfirmdetails,
    updatepoconfirmdetails,
    deletepoconfirmdetails,
    fetchpodetails,
    fetchpoitemdetails
}