logDebug("Event PRA:LICENSES/BUSINESS/TAX RECEIPT/APPLICATION");
if(balanceDue <= 0){
    establishLinks2RefContacts();
    var newLicId = issueLicense();
    if(newLicId){
        BTR_Issue_License_SetExpDate(capId);
        closeTask("Receipt Issuance", "Issued", "Issued via script on payment", "Issued via script on payment");
        //runReportAttach(capId, "Business Tax Receipt", "ID_Record", capId.getCustomID())
        //runReportAttach(newLicId, "Business Tax Receipt", "ID_Record", newLicId.getCustomID())
		runBusinessTaxReceiptAsync(capId, "Business Tax Receipt");
    }
}