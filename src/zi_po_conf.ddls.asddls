@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Purchase Order Confirmations'
define root view entity ZI_PO_CONF
  as select from ekes as conf
  association [1..1] to ekpo as _ekpo on  $projection.Ebeln = _ekpo.ebeln
                                      and $projection.Ebelp = _ekpo.ebelp
{
  key ebeln as Ebeln,
  key ebelp as Ebelp,
  key etens as Etens,
      ebtyp as Ebtyp,
      eindt as Eindt,
      lpein as lpein,
      @Semantics.quantity.unitOfMeasure : 'meins'
      menge as Menge,
      _ekpo.meins,
      _ekpo
}
