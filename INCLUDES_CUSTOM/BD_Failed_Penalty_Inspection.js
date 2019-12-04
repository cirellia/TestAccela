function BD_Failed_Penalty_Inspection(){
try {
        logDebug("Begin BD_Failed_Penalty_Inspection");
        var feeSchedule = "BD_PERMITS";
        var feeItem = "REINSP";
    if(matches(inspResult,"Failed - Penalty Assessed")){
            addFeeWithExtraData(feeItem, feeSchedule, 'FINAL', 1,"Y",capId,inspType);
                logDebug("BD Fee BPFC Assessed");
            }

        logDebug("End BD_Failed_Penalty_Inspection");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: IRSA function BD_Failed_Penalty_Inspection(), please contact administrator. Error: " + err);
    }
}

