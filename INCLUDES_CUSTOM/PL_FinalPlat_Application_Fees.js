function PL_FinalPlat_Application_Fees() {
    try {
        logDebug("Begin PL_FinalPlat_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var propNumOfLots = AInfo["Proposed Number of Lots"];
        updateFee("FSBAPP", "PL_SUBDIVISION", "FINAL", propNumOfLots, "N");
        logDebug("End PL_FinalPlat_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_FinalPlat_Application_Fees(), please contact administrator. Error: " + err);
    }
}

