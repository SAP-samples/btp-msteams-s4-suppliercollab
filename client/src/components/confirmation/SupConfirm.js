import React, { useState, useEffect, useContext } from "react";
import {
  Flex,
  TeamCreateIcon,
  EditIcon,
  TableDeleteIcon,
  SaveIcon,
  FormInput,
  FormDatepicker,
  FormButton
} from "@fluentui/react-northstar";
import moment from "moment";
/*
function convDateToAPIFormat(date: string) {
  const tsSec = parseInt(ts.substring(6, ts.length - 2)) / 1000;
  const date = moment.unix(tsSec).format("DD-MM-YYYYTHH:mm:ss");
  return date;
}
*/

export default function SupConfirm({
  confirmation,
  deleteFunc,
  duplicateFunc,
  saveFunc,
  initMode
}) {
  const [editMode, setEditMode] = useState(initMode);
  const [quantity, setQuantity] = useState(confirmation.quantity);
  const [delDateSupConfirmation, setDelDateSupConfirmation] = useState(
    confirmation.delDateSupConfirmation
  );
  if (editMode === "false") {
    return (
      <div>
        <Flex gap="gap.small">
          <FormInput
            label="Quantity"
            name="supQuantity"
            disabled
            value={quantity}
          />
        </Flex>
        <br />
        <FormDatepicker
          label="Delivery Date Supplier Confirmation"
          id="delDateSupConfirmation"
          disabled
          selectedDate={delDateSupConfirmation}
        />
        <br />
        <Flex gap="gap.small">
          <FormButton
            tinted
            content="Delete"
            icon={<TableDeleteIcon />}
            onClick={() => {
              /*
              const confirmObj = {
                uuid: confirmation.uuid,
                serialNumber: confirmation.serialNumber,
                seqNumber: confirmation.seqNumber
              };
              */
              deleteFunc(confirmation);
            }}
          />
          <FormButton
            tinted
            content="Duplicate"
            icon={<TeamCreateIcon />}
            onClick={() => {
              /*
              const confirmObj = {
                quantity: quantity,
                delDateSupConfirmation: delDateSupConfirmation,
                uuid: confirmation.uuid,
                serialNumber: confirmation.serialNumber,
                seqNumber: 0
              };
              */
              duplicateFunc(confirmation);
            }}
          />
        </Flex>
        <br />
        <Flex gap="gap.small">
          <FormButton
            tinted
            content="Edit"
            icon={<EditIcon />}
            onClick={() => setEditMode("true")}
          />
        </Flex>
        <br />
      </div>
    );
  } else {
    return (
      <div>
        <Flex gap="gap.small">
          <FormInput
            label="Quantity"
            name="supQuantity"
            value={quantity}
            onChange={(_, item) => {
              const result = item.value.replace(/\D/g, '');
              setQuantity(result);
            }}
          />
        </Flex>
        <br />
        <FormDatepicker
          label="Delivery Date Supplier Confirmation"
          id="delDateSupConfirmation"
          selectedDate={delDateSupConfirmation}
          onDateChange={(_, item) => {
            const date = item.itemProps.value.originalDate;
            setDelDateSupConfirmation(date);
          }}
        />
        <br />
        <br />
        <Flex gap="gap.small">
          <FormButton
            tinted
            content="Save"
            icon={<SaveIcon />}
            onClick={() => {
              const confirmObj = {
                poId:confirmation.poId,
                poItemId:confirmation.poItemId,
                quantity: quantity,
                delDateSupConfirmation: delDateSupConfirmation,
                uuid: confirmation.uuid,
                serialNumber: confirmation.serialNumber,
                seqNumber: confirmation.seqNumber
              };
              setEditMode("false");
              saveFunc(confirmObj);
            }}
          />
          <FormButton
            tinted
            content="Cancel"
            icon={<TableDeleteIcon />}
            onClick={() => {
              setQuantity(confirmation.quantity);
              setDelDateSupConfirmation(confirmation.delDateSupConfirmation);
              setEditMode("false");
            }}
          />
        </Flex>
        <br />
      </div>
    );
  }
}
