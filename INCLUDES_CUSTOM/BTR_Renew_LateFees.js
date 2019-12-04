function BTR_Renew_LateFees() {
    try {
        logDebug("Begin BTR_Renew_LateFees");
        loadAppSpecific(AInfo, capId);
        var lateFeeAccrued = AInfo["Late Fees Accrued"];
        var expiredwithPenalty = AInfo["Expired with Penalty"];
        var feeSchedule = "BTR_MAIN";
        var feeItem = "BTRLATE";
        if (wfTask == "Licensing Review" && wfStatus == "Approved for Renewal") {
            if (expiredwithPenalty == "CHECKED") {
                updateFee(feeItem, feeSchedule, 'FINAL', lateFeeAccrued, "N");
                logDebug("BTR Late Fee BTRLATE Assessed");
            }
        }
        logDebug("End BTR_Renew_LateFees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Renew_LateFees(), please contact administrator. Error: " + err);
    }
}

