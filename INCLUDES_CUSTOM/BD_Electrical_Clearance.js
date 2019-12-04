function BD_Electrical_Clearance() {
    try {
        logDebug("Begin BD_Electrical_Clearance");
        loadAppSpecific(AInfo, capId);
        var vReportFile = [];
        var templateName = "BD_ELEC CLEARANCE";
        //get address
        var addrResult = getPrimaryAddressLine();
        //
        //var emailTo = "floridamunicipalities@duke-energy.com";
        var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
        var altId = capId.getCustomID();
        var emailTo = "Cirellia@deland.org";
        var emailFrom = "no-reply@deland.gov";
        var iDate = inspResultDate;
        var emailParameters = aa.util.newHashtable();
        emailParameters.put("$$INSPDATE$$", iDate);
        emailParameters.put("$$CAPADDR$$", addrResult);
        emailParameters.put("$$CAPID$$", altId);
        var clearance = AInfo['Electric Clearance Needed'];

        if (matches(inspType, "Electrical Final", "Early Power (Pre-power)") && matches(inspResult, "Approved")) {
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    aa.print("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    aa.print("  *** Notification Failed to Send");
                }
            }
        }
        editAppSpecific("Electric Clearance Date", dateAdd(null, 0));
        logDebug("End BD_Electrical_Clearance");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Electrical_Clearance(), please contact administrator. Error: " + err);
    }
}

