import axios from "axios";
import moment from "moment";
import React, { useState, useEffect, useContext } from "react";
import 'react-notifications/lib/notifications.css';
import TeamsContext from '../../context/TeamsContext';
import * as microsoftTeams from "@microsoft/teams-js";
import { v4 as uuidv4 } from "uuid";
import {
  Text,
  Flex,
  Button,
  Accordion,
  Form,
  FormInput,
  FormButton,
  FormDropdown,
  Dialog,
  Loader
} from "@fluentui/react-northstar";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./PODetails.css";
import { PODetailsForm } from "../../models/PODetailsForm";
import SupConfirm from "../confirmation/SupConfirm";
import { clientContext, getPODetailsForChatId, getPODetails, getPOItemDetails, savePOItemConfirmationDetails, deletePOItemConfirmationDetails } from '../../service/TeamsClientService'
const reactNotifications = require('react-notifications');
const {NotificationContainer, NotificationManager} = reactNotifications;
const itemLabelId = "item-label";
let supConfirmationPanels: { key:string, title: string; content: JSX.Element }[] = [];
let supConfirmations: any = [];
const defaultIndex = 0;
const accordionExclusive: boolean = true;

function convTSToDate(ts: string) {
  const tsSec = parseInt(ts.substring(6, ts.length - 2)) / 1000;
  const date = moment.unix(tsSec).format("DD-MM-YYYY");
  return date;
}

function convDateTimestampToTSSec(ts: string) {
  const tsSec = parseInt(ts.substring(6, ts.length - 2));
  return new Date(tsSec);
}
let callOnce = true;
export const PODetails = () => {
  const { teamsContext, authCode } = useContext(TeamsContext);
  //set initial values for po details
  const [poId, setPOId] = useState<string>("4500001124");
  const [purchaseGroup, setPurchaseGroup] = useState<string>("401");
  const [supplierDetails, setSupplierDetails] = useState<string>("Domestic US Supplier 1");
  const [poItems, setPOItems] = useState<Array<string>>(["00010"]);
  let poItemId = poItems[0];
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [material, setMaterial] = useState<string>("");
  const [poQuantity, setPOQuantity] = useState<string>();
  const [orderUnit, setOrderUnit] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [plant, setPlant] = useState<string>("");
  const [shortText, setShortText] = useState<string>("");
  const [orderAckNumber, setOrderAckNumber] = useState<string>("");
  const [supConfirmationPanels1, setSupConfirmationPanels1] = useState<
    { key:string, title: string; content: JSX.Element }[] | []
  >([]);

  useEffect(() => {
    setInitLoading(true)
    if (teamsContext && authCode) {
      getPODetailsForChatId(authCode, teamsContext.chatId).then(res => {
        console.log("res.data is : "+res.data.purchasingDoc);
        const poData = res.data;
        if (poData) {
          setPOId(poData.purchasingDoc);
          setPurchaseGroup(poData.purchasingGroup);
          setSupplierDetails(poData.supplierText);
          setPOItems(poData.purchaseOrderItems);
          setInitLoading(false);
        } else {
          setInitLoading(false);
          alert("Purchase Order details not found");
        }
      });
    } 
  }, [teamsContext, authCode]);

  async function fetchPOItemDetails(isSearch:boolean) {
    try {
      showSearchLoading(isSearch,true);
      const poItemResponse = await getPOItemDetails(authCode, poId, poItemId);
      if (poItemResponse.data.d.results) {
        const poItemData = poItemResponse.data.d.results[0];
        setMaterial(poItemData.Material);
        setPOQuantity(poItemData.OrderQuantity);
        setOrderUnit(poItemData.PurchaseOrderQuantityUnit);
        setDeliveryDate(
          convTSToDate(poItemData.to_PurchaseOrderTP.PurchaseOrderDate)
        );
        setPlant(poItemData.to_PlantValueHelp.PlantName);
        setShortText(poItemData.PurchaseOrderItemText);
        setOrderAckNumber(poItemData.PurgDocOrderAcknNumber);
        //clear confirmation panels and generate them again.
        supConfirmations = poItemData.to_PurOrdSupplierConfirmation.results;
        supConfirmationPanels = [];
        let i = 0;
        for (const supConfirmation of supConfirmations) {
          const serialNumber = i + 1;
          const confirmation = createConfirmationObj(serialNumber,supConfirmation.SequentialNmbrOfSuplrConf,
            supConfirmation.ConfirmedQuantity,convDateTimestampToTSSec(supConfirmation.DeliveryDate));
            supConfirmationPanels = supConfirmationPanels.concat({
              key: confirmation.uuid,
              title: "Confirmation " + serialNumber,
              content: (
                createConfirmPanel(confirmation,"false")
              )
          });
          i++;
        }
        setSupConfirmationPanels1(supConfirmationPanels);
        showSearchLoading(isSearch,false);
      } else {
        showSearchLoading(isSearch,false);
        alert("Purchase Order details not found");
      }
    } catch (err) {
      console.error(err);
      showSearchLoading(isSearch,false);
    }
  }

  function showSearchLoading(isSearch:boolean,status:boolean){
    if(isSearch){
      setSearchLoading(status);
    }
  }

  function createConfirmationObj(serialNumber:any,seqNumber:any,quantity:any,delDateSupConfirmation:any){
    const confirmation = {
      uuid: uuidv4(),
      poId: poId,
      poItemId: poItemId,
      serialNumber: serialNumber,
      seqNumber: seqNumber,
      quantity: quantity,
      delDateSupConfirmation: delDateSupConfirmation
    }
    return confirmation;
  }

  function createConfirmPanel(confirmation:any,initMode:string){
    return <SupConfirm
    confirmation={confirmation}
    deleteFunc={handleDelete}
    duplicateFunc={handleDuplicate}
    saveFunc={handleSave}
    initMode={initMode}
  />
  }

  /* save handler */
  async function handleSave(confirmObj: any) {
    try{
      setLoading(true);
      await savePOItemConfirmationDetails(authCode, confirmObj);
      await fetchPOItemDetails(false);
      setLoading(false);
      NotificationManager.success('Confirmation Details saved successfully','',3000);
    }catch(err){
      setLoading(false);
      NotificationManager.error('Error occured while saving confirmation details.Please try again.','',3000);
    }
  }

  /* save handler */
  async function handleDelete(confirmObj: any) {
    try{
      setLoading(true);
      await deletePOItemConfirmationDetails(authCode, confirmObj);
      //delete the item
      supConfirmationPanels = supConfirmationPanels.filter(item => item.key !== confirmObj.uuid);
      setSupConfirmationPanels1(supConfirmationPanels);
      await fetchPOItemDetails(false);
      setLoading(false);
      NotificationManager.success('Confirmation Details deleted successfully','',3000);
    }catch(err){
      setLoading(false);
      NotificationManager.error('Error occured while deleting confirmation details.Please try again.','',3000);
    }
  }
  /*duplicate handler */
  async function handleDuplicate(confirmObj: any) {
    const nextIndex = supConfirmationPanels.length + 1;
    const title = "Confirmation " + nextIndex;

    const newConfirmObj = createConfirmationObj(nextIndex,0,confirmObj.quantity,confirmObj.delDateSupConfirmation)
    supConfirmationPanels = supConfirmationPanels.concat({
      key: newConfirmObj.uuid,
      title: title,
      content: ( 
        createConfirmPanel(newConfirmObj,"true")
      )
    });
    setSupConfirmationPanels1(supConfirmationPanels);
  }

  /* add handler */
  async function handleAdd() {
    const nextIndex = supConfirmationPanels.length + 1;
    const title = "Confirmation " + nextIndex;
    const confirmObj = createConfirmationObj(nextIndex,0,0,"")

    supConfirmationPanels = supConfirmationPanels.concat({
      key: confirmObj.uuid,
      title: title,
      content: (
        createConfirmPanel(confirmObj,"true")
      )
    });
    setSupConfirmationPanels1(supConfirmationPanels);
  }
  return (
    <div className="parent">
        <br />
        <NotificationContainer/>
        {initLoading ? (
          <Flex hAlign="center" className="content-loader">
              <Loader />
          </Flex>
        ) : (
        <Form>
        <FormButton
          secondary
          content={"Launch Qualitrics Survey"}
          onClick={(e) => {
            e.preventDefault();
            window.open(
              "https://sapsandbox.eu.qualtrics.com/jfe/preview/SV_0udKZhVnildVavk?Q_CHL=preview&Q_SurveyVersionID=current",
              "_blank"
            );
          }}
        ></FormButton>
        <Text content="Supplier Details" size="medium" />
        <Text
          content={supplierDetails}
          size="medium"
          weight="semibold"
        />
        <Flex gap="gap.smaller">
          <Text content="Purchasing Group: " size="small" />
          <Text content={purchaseGroup} size="small" />
        </Flex>
        <Flex gap="gap.small">
          <FormInput
            label="Purchase Order"
            name="poNumber"
            disabled
            value={poId}
          />
        </Flex>
        <Flex gap="gap.small">
        <FormDropdown 
            label={{ content: `Item`, id: itemLabelId }}
            items={poItems}
            aria-labelledby={itemLabelId}
            placeholder="Select PO Item"
            onChange={(_, item) => {
              poItemId = item.value as string;
            }}
            defaultActiveSelectedIndex={defaultIndex}
          />
        </Flex>
        <Flex hAlign="start">
          <FormButton
            primary
            content="Search Order"
            onClick={() => {
              fetchPOItemDetails(true);
            }}
          />
        </Flex>
        </Form>
        )}
      <br />
      {searchLoading ? (
          <Flex hAlign="center" className="content-loader">
              <Loader />
          </Flex>
      ) : (
        <Tabs>
          <TabList>
            <Tab>Order Summary</Tab>
            <Tab>Confirmations</Tab>
          </TabList>
          <TabPanel>
            <Flex>
              <Flex.Item size="size.quarter">
                <Text content="Material" size="medium" />
              </Flex.Item>
              <Flex.Item size="size.quarter">
                <Text content="Quantity" size="medium" />
              </Flex.Item>
              <Flex.Item size="size.quarter">
                <Text content="Order Unit" size="medium" />
              </Flex.Item>
            </Flex>
            <Flex>
              <Flex.Item size="size.quarter">
                <Text content={material} size="medium" weight="semibold" />
              </Flex.Item>
              <Flex.Item size="size.quarter">
                <Text content={poQuantity} size="medium" weight="semibold" />
              </Flex.Item>
              <Flex.Item size="size.quarter">
                <Text content={orderUnit} size="medium" weight="semibold" />
              </Flex.Item>
            </Flex>
            <br />
            <Flex>
              <Flex.Item size="size.half">
                <Text content="Delivery Date" size="medium" />
              </Flex.Item>
              <Flex.Item size="size.half">
                <Text content="Plant" size="medium" />
              </Flex.Item>
            </Flex>
            <Flex>
              <Flex.Item size="size.half">
                <Text content={deliveryDate} size="medium" weight="semibold" />
              </Flex.Item>
              <Flex.Item size="size.half">
                <Text content={plant} size="medium" weight="semibold" />
              </Flex.Item>
            </Flex>
            <br />
            <Flex>
              <Text content="Short Text" />
            </Flex>
            <Text weight="semibold" content={shortText} />
            <br />
          </TabPanel>
          <TabPanel>
            <Flex gap="gap.small">
              <Form>
                <FormInput
                  label="Order Acknowledgement Number"
                  name="orderAckNumber"
                  disabled
                  value={orderAckNumber}
                />
              </Form>
            </Flex>
            <br />
            <Flex gap="gap.medium">
              <Text weight="semibold" content="Confirmations" />
              <Button
                primary
                content="+Add"
                onClick={() => {
                  handleAdd();
                }}
              />
            </Flex>
            <div>
            {loading ? (
                  <Flex hAlign="center" className="content-loader">
                      <Loader />
                  </Flex>
              ) : (
            <Accordion
              defaultActiveIndex={[0]}
              panels={supConfirmationPanels1}
              exclusive={accordionExclusive} />
              )}
              </div>
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
};
