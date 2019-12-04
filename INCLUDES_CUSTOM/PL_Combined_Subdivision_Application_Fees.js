function PL_Combined_Subdivision_Application_Fees() {
    try {
        logDebug("Begin PL_Combined_Subdivision_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var propNumOfLots = AInfo["Proposed Number of Lots"];
        if (propNumOfLots > 0) {
            updateFee("CSBAPP", "PL_SUBDIVISION", "FINAL", propNumOfLots, "N");
        }
        logDebug("End PL_Combined_Subdivision_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Combined_Subdivision_Application_Fees(), please contact administrator. Error: " + err);
    }
}

