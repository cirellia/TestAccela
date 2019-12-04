function BTR_Assess_BTR_Fee(){
    try{
        logDebug("begin BTR_Assess_BTR_Fee");
        var feeSchedule = "BTR_MAIN";
        var BTR = "BTRYEAR";
        var Fire = "BTRFIREPERM";
        loadAppSpecific(AInfo, capId);
        var BTRTotalLicFee = AInfo['BTR Total License Fee'];
        var TotalFireFee = AInfo['Total Fire Fees'];
        if(wfTask == "Building Review" && matches(wfStatus, 'Approved', 'Completed Change of Use Required', 'Completed No Issue')) {
            if (BTRTotalLicFee && BTRTotalLicFee > 0 && AInfo["Business Type of Organization"] != '501c3 Not for Profit'){
                updateFee(BTR, feeSchedule, 'FINAL', parseFloat(BTRTotalLicFee), "N");
            }

            if (TotalFireFee && TotalFireFee > 0){
                updateFee(Fire, feeSchedule, 'FINAL', TotalFireFee, "N");
            }

            logDebug("BTR and Fire Fees");
        }
        logDebug("end BTR_Assess_BTR_Fee");
    }
    catch(err){
        showMessage = true;
        comment("Error on custom function BTR_Assess_BTR_Fee(). Please contact administrator. Err: " + err);
    }
}

