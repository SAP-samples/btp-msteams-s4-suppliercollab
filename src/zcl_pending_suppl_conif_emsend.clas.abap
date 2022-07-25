CLASS zcl_pending_suppl_conif_emsend DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    METHODS constructor .
    METHODS run_em_job.
  PROTECTED SECTION.
PRIVATE SECTION.

  TYPES:
    BEGIN OF ty_suppl_conf_po_line,
      purchasingdocument           TYPE c_purgdocsuplrconfmain-purchasingdocument,
      purchasingdocumentitem       TYPE c_purgdocsuplrconfmain-purchasingdocumentitem,
      supplierconfirmationcategory TYPE c_purgdocsuplrconfmain-supplierconfirmationcategory,
      scheduleline                 TYPE c_purgdocsuplrconfmain-scheduleline,
      supplierconfcategoryname     TYPE c_purgdocsuplrconfmain-supplierconfcategoryname,
      scheduledquantity            TYPE c_purgdocsuplrconfmain-scheduledquantity,
      purchaseorderitem            TYPE c_purgdocsuplrconfmain-purchaseorderitem,
      supplier                     TYPE c_purgdocsuplrconfmain-supplier,
      suppliername                 TYPE c_purgdocsuplrconfmain-suppliername,
      documentdate                 TYPE c_purgdocsuplrconfmain-documentdate,
      schedulelinedeliverydate     TYPE c_purgdocsuplrconfmain-schedulelinedeliverydate,
      material                     TYPE c_purgdocsuplrconfmain-material,
      materialname                 TYPE c_purgdocsuplrconfmain-materialname,
      purchasingdocumentitemtext   TYPE c_purgdocsuplrconfmain-purchasingdocumentitemtext,
      delivdatecategory            TYPE c_purgdocsuplrconfmain-delivdatecategory,
      orderquantity                TYPE c_purgdocsuplrconfmain-orderquantity,
      keydate                      TYPE c_purgdocsuplrconfmain-keydate,
      stilltobedeliveredquantity   TYPE c_purgdocsuplrconfmain-stilltobedeliveredquantity,
      stilltoinvoicequantity       TYPE c_purgdocsuplrconfmain-stilltoinvoicequantity,
      invoicereceiptqty            TYPE c_purgdocsuplrconfmain-invoicereceiptqty,
      committedquantity            TYPE c_purgdocsuplrconfmain-committedquantity,
      PurchasingGroup              TYPE c_purgdocsuplrconfmain-PurchasingGroup,
    END OF ty_suppl_conf_po_line .
  TYPES:
    ty_suppl_conf_po_tab TYPE TABLE OF ty_suppl_conf_po_line WITH EMPTY KEY .

  DATA:
    dest_name    TYPE c LENGTH 20 .
  DATA:
    auth_profile TYPE c LENGTH 20 .
  DATA:
    auth_conf    TYPE c LENGTH 20 .
  DATA oa2c_client TYPE REF TO if_oauth2_client .

  METHODS get_pending_suppl_conf_pos
    RETURNING
      VALUE(pend_supp_pos) TYPE ty_suppl_conf_po_tab .
  METHODS connect_to_em
    RETURNING
      VALUE(http_client) TYPE REF TO if_http_client .
  METHODS send_suppl_conf_po_to_em
    IMPORTING
      !http_client TYPE REF TO if_http_client
      !suppl_confs TYPE ty_suppl_conf_po_tab .
ENDCLASS.



CLASS ZCL_PENDING_SUPPL_CONIF_EMSEND IMPLEMENTATION.


  METHOD connect_to_em.

    " Get the destination http client
    cl_http_client=>create_by_destination(
                                  EXPORTING  destination = dest_name
                                  IMPORTING  client                   = http_client
                                  EXCEPTIONS argument_not_found       = 1
                                             destination_not_found    = 2
                                             destination_no_authority = 3
                                             plugin_not_active        = 4
                                             internal_error           = 5
                                             OTHERS                   = 6 ).
    http_client->propertytype_logon_popup = if_http_client=>co_disabled.
    IF sy-subrc <> 0.
* Raise error and exception handling in case of instation of http_client failed
    ENDIF.

**  Set token for authorization OAuth 2.0
    TRY.
        cl_oauth2_client=>create( EXPORTING i_profile        = CONV #( auth_profile )
                                            i_configuration  = CONV #( auth_conf )
                                  RECEIVING ro_oauth2_client = oa2c_client ).
      CATCH cx_oa2c.
* Raise error and exception handling in case of client creation failed for OAuth profile
    ENDTRY.


    TRY.
        oa2c_client->set_token( EXPORTING io_http_client = http_client ).

      CATCH cx_oa2c.
        TRY.
            " Executing the client credentials flow
            CALL METHOD oa2c_client->execute_cc_flow.
          CATCH cx_oa2c.
* Raise error and exception handling in case of token set is failed
        ENDTRY.

        TRY.
            oa2c_client->set_token( EXPORTING io_http_client = http_client ).
          CATCH cx_oa2c.
* Raise error and exception handling in case of token set is failed
        ENDTRY.
    ENDTRY.

    DATA(request_headers) = VALUE tihttpnvp( ( name  = 'x-qos'
                                               value = '1' ) ).



** Set URI tfeindia/s4/t1/
    " Purchase Requisition Queue in the event mesh
    cl_http_utility=>set_request_uri( EXPORTING  request = http_client->request
                                                 uri     = '/messagingrest/v1/queues/tfeindia%2Fs4%2Ft1%2FPOConfirmations/messages' ).

** Set request headers for the call if passed
    LOOP AT request_headers ASSIGNING FIELD-SYMBOL(<header>).
      http_client->request->set_header_field( EXPORTING  name  = <header>-name
                                                            value = <header>-value ).
    ENDLOOP.

    http_client->refresh_cookie( ).

** Set Request Method (GET/POST/PATCH)
    http_client->request->set_method( method = 'POST' ).
  ENDMETHOD.


  METHOD constructor.

    dest_name = 'EM_CONNECT_TEAMS'.
    auth_profile = '/IWXBE/MGW_MQTT'.
    auth_conf = 'EM_OAUTH_CLIENT'.

  ENDMETHOD.


  METHOD get_pending_suppl_conf_pos.
    " Get the pending supplier confirmations from the CDS view
    SELECT
       c_purgdocsuplrconfmain~purchasingdocument,
       c_purgdocsuplrconfmain~purchasingdocumentitem,
       c_purgdocsuplrconfmain~supplierconfirmationcategory,
       c_purgdocsuplrconfmain~scheduleline,
       c_purgdocsuplrconfmain~supplierconfcategoryname,
       c_purgdocsuplrconfmain~scheduledquantity,
       c_purgdocsuplrconfmain~purchaseorderitem,
       c_purgdocsuplrconfmain~supplier,
       c_purgdocsuplrconfmain~suppliername,
       c_purgdocsuplrconfmain~documentdate,
       c_purgdocsuplrconfmain~schedulelinedeliverydate,
       c_purgdocsuplrconfmain~material,
       c_purgdocsuplrconfmain~materialname,
       c_purgdocsuplrconfmain~purchasingdocumentitemtext,
       c_purgdocsuplrconfmain~delivdatecategory,
       c_purgdocsuplrconfmain~orderquantity,
       c_purgdocsuplrconfmain~keydate,
       c_purgdocsuplrconfmain~stilltobedeliveredquantity,
       c_purgdocsuplrconfmain~stilltoinvoicequantity,
       c_purgdocsuplrconfmain~invoicereceiptqty,
       c_purgdocsuplrconfmain~committedquantity,
       c_purgdocsuplrconfmain~PurchasingGroup
     FROM
      c_purgdocsuplrconfmain( p_displaycurrency = 'USD' )
      INTO TABLE @pend_supp_pos
     WHERE
      supplierconfirmationcategory = 'AB'.
  ENDMETHOD.


  METHOD run_em_job.
    " Get the pending supplier confirmations
    DATA(suppl_conf_pos) = get_pending_suppl_conf_pos( ).

    CHECK suppl_conf_pos IS NOT INITIAL.

    " Getting the HTTP client(OAuth Based) to send the data to Event Mesh
    DATA(http_client) = connect_to_em( ).

    " Send to event mesh
    send_suppl_conf_po_to_em(
      http_client     = http_client
      suppl_confs   = suppl_conf_pos ).
  ENDMETHOD.


  METHOD send_suppl_conf_po_to_em.

    TYPES:
      BEGIN OF ty_po_data,
        poid          TYPE string,
        supplier_id   TYPE string,
        supplier_name TYPE string,
        pendconfitems LIKE suppl_confs,
      END   OF ty_po_data.

    DATA:
      BEGIN OF em_data,
        mailid     TYPE string,
        po_details TYPE TABLE OF ty_po_data,
      END OF em_data.

    LOOP AT suppl_confs INTO DATA(suppl_conf) GROUP BY suppl_conf-purchasingdocument.
      APPEND VALUE #(  ) TO em_data-po_details ASSIGNING FIELD-SYMBOL(<po_details>).
      LOOP AT GROUP suppl_conf ASSIGNING FIELD-SYMBOL(<suppl_conf>).
        <po_details>-poid = <suppl_conf>-purchasingdocument.
        <po_details>-supplier_id = <suppl_conf>-supplier.
        <po_details>-supplier_name = <suppl_conf>-suppliername.
        APPEND CORRESPONDING #( <suppl_conf> ) TO <po_details>-pendconfitems.
      ENDLOOP.
    ENDLOOP.

*    em_data-confs = suppl_confs.
    " Dummy mailid, used to send to the teams user,
    " Should be replaced with the appropriate logic
    em_data-mailid = 'james.trott@saptfe.onmicrosoft.com'.

    " Convert to JSON
    /ui2/cl_json=>serialize(
      EXPORTING
        data             = em_data
        pretty_name      = /ui2/cl_json=>pretty_mode-camel_case
      RECEIVING
        r_json           = DATA(json)                 " JSON string
    ).

    http_client->request->set_content_type(
      EXPORTING
        content_type = if_rest_media_type=>gc_appl_json ).

    http_client->request->set_cdata( json ).

    http_client->send( EXCEPTIONS  http_communication_failure = 1
                                   http_invalid_state = 2
                                   http_processing_failed = 3
                                   http_invalid_timeout  = 4 ).
    IF sy-subrc <> 0.
* Raise error and exception handling if call is failed
    ENDIF.

********Fire Recieve call to fetch response from (http_client)

    http_client->receive( EXCEPTIONS http_communication_failure = 1
                                     http_invalid_state         = 2
                                     http_processing_failed     = 3 ).

    IF sy-subrc <> 0.
* Raise error and exception handling if response is not received
    ENDIF.

    DATA: headers TYPE tihttpnvp.

**** Fetch Response Headers
    CALL METHOD http_client->response->get_header_fields( CHANGING fields = headers ).

    http_client->response->get_status( IMPORTING code = DATA(code) )." Get workitem data

  ENDMETHOD.
ENDCLASS.
