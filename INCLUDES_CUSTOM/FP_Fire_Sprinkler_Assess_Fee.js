function FP_Fire_Sprinkler_Assess_Fee() {
    try {
        logDebug("begin function FP_Fire_Sprinkler_Assess_Fee");

        loadAppSpecific(AInfo, capId);
        var quantity = AInfo["Building Square Footage"];
        if (wfTask == "Plan Check" && wfStatus == "Approved") {
            updateFee("FIRESPRINK", "FP_SPRINKLER", "FINAL", quantity, "N");
            logDebug("Fee FIRESPRINK assessed");
        }
        logDebug("End function FP_Fire_Sprinkler_Assess_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function FP_Fire_Sprinkler_Assess_Fee(). Please contact administrator. Err: " + err);
    }
}

