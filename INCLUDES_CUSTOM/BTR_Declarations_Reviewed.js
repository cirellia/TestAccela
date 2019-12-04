function BTR_Declarations_Reviewed(itemCap) {
    try {
        logDebug("Begin BTR_Declarations_Reviewed");
        var parentLicenseCAPID;
        if (wfTask == "Declarations Review" && wfStatus == "Completed") {
            parentLicenseCAPID = getParent(itemCap);
            if (parentLicenseCAPID) {
                parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
                var licCustID = parentLicenseCAPID.getCustomID();
                logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
                //copyASIFields(itemCap, parentLicenseCAPID);
                copyAppSpecific(parentLicenseCAPID);
                copyASITables(itemCap, parentLicenseCAPID);
                copyAddresses(itemCap, parentLicenseCAPID);
                copyContacts(itemCap, parentLicenseCAPID);
                copyOwner(itemCap, parentLicenseCAPID);
                updateAppStatus("Active", "", parentLicenseCAPID);
            }
            else {
                logDebug("WARNING: Unable to get the parent license");
            }
        }
        logDebug("End BTR_Declarations_Reviewed");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Declarations_Reviewed(), please contact administrator. Error: " + err);
    }
}

