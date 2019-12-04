function PL_Variance_Application_Fees() {
    try {
        logDebug("Begin PL_Variance_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var existingUse = AInfo["Existing Use"];
        var vFeeSched = "PL_MAIN";
        var vFeeItem = "VARSFR";
        var vFeeItemothers = "VAR";
        if ((existingUse == "Single-family dwellings", 'existingUse == "Single-family dwellings"')) {
            updateFee(vFeeItem, vFeeSched, "FINAL", 1, "N");
        }
        else {
            if(!publicUser) updateFee(vFeeItemothers, vFeeSched, "FINAL", 1, "N");
        }

        logDebug("End PL_Variance_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PL_Variance_Application_Fees. Contact your system administrator. " + err.message);
    }
}

