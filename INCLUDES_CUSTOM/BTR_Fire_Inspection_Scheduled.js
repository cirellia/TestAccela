function BTR_Fire_Inspection_Scheduled() {
    try {
        logDebug("begin BTR_Fire_Inspection_Scheduled");
        if (wfTask == "Fire Review" && wfStatus == "Inspection Required") {
            scheduleInspection("BTR Fire Inspection", 1);
            logDebug("Fire Inspection Scheduled");
            var feeSchedule = "BTR_MAIN";
            var feeItem = "FIREOCCLIC";
            updateFee(feeItem, feeSchedule, 'FINAL', 1, "N");
        }
        logDebug("end BTR_Fire_Inspection_Scheduled");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function BTR_Fire_Inspection_Scheduled(). Please contact administrator. Err: " + err);
    }
}

