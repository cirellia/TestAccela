logDebug("Event PRA:LICENSES/BUSINESS/TAX RECEIPT/RENEWAL");
if(balanceDue <= 0){
    BTR_Set_Renew_License(capId);
    closeTask("Receipt Issuance", "Renewed", "Renewed via script on payment", "Renewed via script on payment");
    runBusinessTaxReceiptAsync(capId, "Business Tax Receipt");
}