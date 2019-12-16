function PL_Fees_Assessed_after_Intake() {
    logDebug("Begin PL_Fees_Assessed_after_Intake");
    try {
        var emailFrom;
        var emailTo;
        var templateName = "PL_APPICATIONACCEPTED_FEESDUE";

        var reportFile = [];
        var vFees = loadFees(capId);
        var feesAdded = false;
        var invoiceResult_L; //wfStatus = "Fees Assessed"
        if (wfStatus == "Fees Assessed") {
            for (i in vFees) {
                thisFee = vFees[i];
                logDebug("We have a fee " + thisFee.code + " with status of: " + thisFee.status);
                //only process fees that are not already invoiced
                if (thisFee.status == "NEW") {
                    //invoiceFee2(thisFee.code, thisFee.period);
                    invoiceResult_L = aa.finance.createInvoice(capId, thisFee.sequence, thisFee.period);
                    if (invoiceResult_L.getSuccess()) {
                        logDebug("Invoicing assessed fee items to specified CAP is successful.");
                        feesAdded = true;
                    }
                    else
                        logDebug("**ERROR: Invoicing the fee items assessed to specified CAP was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
                }
            }
            var thebalance = getBalance("", "", null, capId);
            if (thebalance) { thebalance = "$" + thebalance; }
            var emailParameters = aa.util.newHashtable();
            var contact = getContactByTypeAA("Applicant", capId); //balanceDue = 400;
            var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
            var altId = capId.getCustomID();
            var cap = aa.cap.getCap(capId).getOutput();
            var capAlias = cap.getCapType().getAlias();
            emailFrom = "no-reply@deland.gov";
            emailTo = contact.email;
            emailParameters.put("$$CAPID$$", altId);
            emailParameters.put("$$CAPNAME$$", capAlias);
            emailParameters.put("$$BALANCE$$", thebalance);
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    logDebug("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    logDebug("  *** Notification Failed to Send");
                }
            }
        }
        logDebug("End PL_Fees_Assessed_after_Intake");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Fees_Assessed_after_Intake(), please contact administrator. Error: " + err);
    }
}
