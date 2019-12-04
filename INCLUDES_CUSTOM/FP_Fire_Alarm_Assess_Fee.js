function FP_Fire_Alarm_Assess_Fee() {
    try {
        logDebug("begin function FP_Fire_Alarm_Assess_Fee");

        loadAppSpecific(AInfo, capId);
        var quantity = AInfo["Building Square Footage"];
        if (wfTask == "Plan Check" && wfStatus == "Approved") {
            updateFee("FIREALARM", "FP_ALARM", "FINAL", quantity, "N");
            logDebug("Fee FIREALARM assessed");
        }
        logDebug("End function FP_Fire_Alarm_Assess_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function FP_Fire_Alarm_Assess_Fee(). Please contact administrator. Err: " + err);
    }
}

