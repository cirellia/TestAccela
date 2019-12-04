function PL_Land_Use_Record_Number_Prefix() {
    try {
        logDebug("Begin PL_Land_Use_Record_Number_Prefix");
        loadAppSpecific(AInfo, capId);
        var existingUse = AInfo["Application Type"];
        var prefix = "";
        var sequence = "";
        var newAltID = "";
        var currDate = new Date();
        var year = (currDate.getFullYear().toString().substr(-2));

        if (existingUse == "Comprehensive Plan Amendments") {
            prefix = "CPA";
        } else if (existingUse == "Large Scale Land Use") {
            prefix = "LU";
        } else if (existingUse == "Small Scale Land Use") {
            prefix = "SMLU";
        }
        oldAltID = capId.getCustomID();
        oldAltIDSplit = oldAltID.split("-");
        if (oldAltIDSplit) {
            sequence = oldAltIDSplit[1];
        }

        newAltID = "" + prefix + year + "-" + sequence;
        var updateCapAltIDResult = aa.cap.updateCapAltID(capId, newAltID);

        if (updateCapAltIDResult.getSuccess())
            logDebug(capId + " AltID changed from " + oldAltID + " to " + newAltID);
        else
            logDebug("**WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
        logDebug("End PL_Land_Use_Record_Number_Prefix");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Land_Use_Record_Number_Prefix(), please contact administrator. Error: " + err);
    }
}

