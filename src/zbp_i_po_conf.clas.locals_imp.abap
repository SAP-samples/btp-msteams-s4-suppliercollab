CLASS lsc_ZI_PO_CONF DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.

    METHODS save_modified REDEFINITION.
  PRIVATE SECTION.
    METHODS update_save_table
      IMPORTING
        del    TYPE abap_bool
        entry  TYPE zi_po_conf
      EXPORTING
        confxs TYPE bapimeconf_t_detailx
        confs  TYPE bapimeconf_t_detail.



ENDCLASS.

CLASS lsc_ZI_PO_CONF IMPLEMENTATION.

  METHOD save_modified.
    DATA:
      items         TYPE  bapimeconf_t_item,
      itemxs        TYPE bapimeconf_t_itemx,
      confs         TYPE bapimeconf_t_detail,
      confxs        TYPE bapimeconf_t_detailx,
      messages      TYPE bapiret2_t,
      entry         TYPE zi_po_conf,
      confirmations TYPE STANDARD TABLE OF bapiekes.

    " Only one entry is expected from in this call and should be updated
    " if the requirement changes

    IF create-zi_po_conf IS NOT INITIAL.
      entry = CORRESPONDING #( create-zi_po_conf[ 1 ] ).
      CLEAR entry-Etens.
    ENDIF.

    IF update-zi_po_conf IS NOT INITIAL.
      DATA(upd) = abap_true.
      entry = CORRESPONDING #( update-zi_po_conf[ 1 ] ).
    ENDIF.

    IF delete-zi_po_conf IS NOT INITIAL.
      DATA(del) = abap_true.
      entry = CORRESPONDING #( delete-zi_po_conf[ 1 ] ).
    ENDIF.

    DATA(original_entry) = entry.

    " Always expected to be from a single purchase order and should update
    " the code if otherwise
    APPEND INITIAL LINE TO items ASSIGNING FIELD-SYMBOL(<item>).
    <item>-item_no = entry-Ebelp.
    APPEND INITIAL LINE TO itemxs ASSIGNING FIELD-SYMBOL(<itemx>).
    <itemx>-item_no = entry-Ebelp.

    " Add the entry coming from the API call
    IF del EQ abap_false.
      " If we don't pass delete data, it will be deleted automatically
      update_save_table(
        EXPORTING
          del = del
          entry = entry
        IMPORTING
          confxs = confxs
          confs = confs ).
    ENDIF.
    " FM needs existing data to be passed, else it will remove them, so
    " Passing the existing data again
    CALL FUNCTION 'BAPI_PO_GETDETAIL1'
      EXPORTING
        purchaseorder  = original_entry-Ebeln
      TABLES
        poconfirmation = confirmations.

    DELETE confirmations WHERE po_item NE entry-Ebelp.

    IF upd EQ abap_true.
      " Delete the entry that we are updating or deleting
      DELETE confirmations WHERE conf_ser EQ entry-Etens.
    ENDIF.

    " Remaining entries will go as an update call
    LOOP AT confirmations ASSIGNING FIELD-SYMBOL(<confirmation>).
      entry-Ebelp = <confirmation>-po_item.
      entry-Etens = <confirmation>-conf_ser.
      entry-Menge = <confirmation>-quantity.
      entry-Eindt = <confirmation>-deliv_date.
      update_save_table(
        EXPORTING
          del = abap_false
          entry = entry
        IMPORTING
          confxs = confxs
          confs = confs ).

      IF del EQ abap_true AND original_entry-Etens EQ <confirmation>-conf_ser.
        "Update the indicator
        READ TABLE confxs ASSIGNING FIELD-SYMBOL(<confxs>) WITH KEY conf_ser = original_entry-Etens.
        IF <confxs> IS ASSIGNED.
          <confxs>-delete_ind = abap_true.
        ENDIF.

        READ TABLE confs ASSIGNING FIELD-SYMBOL(<confs>) WITH KEY conf_ser = original_entry-Etens.
        IF <confxs> IS ASSIGNED.
          <confs>-delete_ind = abap_true.
        ENDIF.
      ENDIF.
    ENDLOOP.

    CALL FUNCTION 'ME_PO_CONFIRM'
      EXPORTING
        testrun          = abap_false
        document_no      = original_entry-Ebeln
        item             = items                 " Confirmation Item Data
        itemx            = itemxs                 " Table Type for Change Parameter of Item Data
        confirmation     = confs                 " Confirmation Detail
        confirmationx    = confxs
      IMPORTING
        return           = messages.

*    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
*      EXPORTING
*        wait = abap_true
*      .
  ENDMETHOD.

  METHOD update_save_table.

    APPEND INITIAL LINE TO confs ASSIGNING FIELD-SYMBOL(<conf>).
    <conf>-item_no = entry-Ebelp.
    <conf>-conf_ser = entry-Etens.
    <conf>-conf_category = 'AB'.
    <conf>-quantity = entry-Menge.
    <conf>-deliv_date = entry-Eindt.
    <conf>-deliv_date_typ = 'D'.

    APPEND INITIAL LINE TO confxs ASSIGNING FIELD-SYMBOL(<confx>).
    <confx>-item_no = entry-Ebelp.
    <confx>-item_nox = 'X'.
    <confx>-conf_ser = entry-Etens.
    <confx>-conf_category = 'X'.
    <confx>-conf_serx = 'X'.
    <confx>-quantity = 'X'.
    <confx>-deliv_date = 'X'.
    <confx>-deliv_date_typ = 'X'.
    IF del EQ abap_true.
      <conf>-delete_ind = abap_true.
      <conf>-deliv_date_typ = 'X'.
    ENDIF.

  ENDMETHOD.




ENDCLASS.
