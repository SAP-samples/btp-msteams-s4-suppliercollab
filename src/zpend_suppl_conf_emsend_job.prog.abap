*&---------------------------------------------------------------------*
*& Report ZWFCUSEMSEND_TEAMSINT
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
REPORT zpend_suppl_conf_emsend_job.


DATA:
        timestamp TYPE tzntstmpl.

" TODO: currently we are sending for the last 1 minute pr workitems in the background job  to event mesh,
" ideally a better logic to handle processed and pending workitems should be inplace
NEW zcl_pending_suppl_conif_emsend( )->run_em_job( ).
