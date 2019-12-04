function BTR_Set_Renew_License(itemCap) {
    try {
        logDebug("Begin BTR_Set_Renew_License");
        var currDate = new Date();
        var expDate = new Date();
        var year = currDate.getFullYear();
        var month = currDate.getMonth();
        var day = currDate.getDate();
        var expYear = year;
        var parentLicenseCAPID;

        expDate.setMonth(8); //set expiration month to September
        expDate.setDate(30); //set expiration date to 30
        expYear = expDate.getFullYear() + 1;  //set expiration year to next year


        expDate.setFullYear(expYear);

        var currDateString = currDate.getMonth() + 1 + "/" + currDate.getDate() + "/" + currDate.getFullYear();
        var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
        logDebug("Issuance Date: " + currDateString);
        logDebug("New Expiration Date: " + expDateString);

        parentLicenseCAPID = getParentLicenseCapID(itemCap);
        if (!parentLicenseCAPID) {
            parentLicenseCAPID = getParent(itemCap);
        }
        if (parentLicenseCAPID) {
            parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
            var parentCap = aa.cap.getCap(parentLicenseCAPID).getOutput();
            var licCustID = parentLicenseCAPID.getCustomID();
            logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
            thisLic = new licenseObject(licCustID, parentLicenseCAPID);
            thisLic.setExpiration(expDateString);
            thisLic.setStatus("Active");
            updateAppStatus("Active", "License Renewed", parentLicenseCAPID);
            editAppName(parentCap.getSpecialText(), capId);
            
            renewalCapProject = getRenewalCapByParentCapID(parentLicenseCAPID);
            if (renewalCapProject != null) {
                renewalCapProject.setStatus("Complete");
                logDebug("license(" + parentLicenseCAPID + ") is activated.");
                aa.cap.updateProject(renewalCapProject);
            }
            else{
                logDebug("Unable to find renewal project for license " + parentLicenseCAPID.getCustomID());
            }
        }
        else {
            logDebug("WARNING: Unable to get the parent license and set the expiration date");
        }
        logDebug("End BTR_Set_Renew_License");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Set_Renew_License(), please contact administrator. Error: " + err);
    }
}

