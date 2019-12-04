function WTUB_BD_Issue_Validation() {
    try {
        logDebug("begin function WTUB_BD_Issue_Validation");
        var cap = aa.cap.getCap(capId).getOutput();
        var condResult = aa.capCondition.getCapConditions(capId);
        var totalAppliedConds = 0;
        var totalConds = 0;
        var allCondsMet = false;
        if (wfTask == "Permit Issuance" && wfStatus == "Issued") {
            if (condResult.getSuccess()) {
                var capConds = condResult.getOutput();

                totalConds = capConds.length;
                totalAppliedConds = getConditions(null, "Applied", null, null).length;
            }

            //if there are no conditions or all conditions have been met
            if (totalConds == 0 || (totalConds > 0 && totalAppliedConds == 0)) {
                allCondsMet = true;
            }

            if (balanceDue > 0 || allCondsMet == false) {
                cancel = true;
                showMessage = true;
                comment("Cannot issue permit until all balance is paid and all conditions are met");
            }
        }
        logDebug("End function WTUB_BD_Issue_Validation");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function WTUB_BD_Issue_Validation(). Please contact administrator. Err: " + err);
    }
}

