function BD_Electrical_Permit_Fee() {
    try {
        logDebug("Begin BD_Electircal_Permit_Fee");
        loadAppSpecific(AInfo, capId);
        var vUse = AInfo["Use"];
        var vPhasing = AInfo["Phasing"];
        var existingServiceAmps = parseInt(AInfo["Existing Service Amps"]);
        var newServiceAmps = parseInt(AInfo["Amps"]);
        var changeInAmps = newServiceAmps - existingServiceAmps;
        var vFeeItemCom = "COMMELEC";
        var vFeeItemRes = "RESELEC";
        var vFeeSched = "BD_ELEC";
        if (wfTask == "Electrical" && wfStatus == "Approved") {
            if (vUse == "Commercial") {
                if (changeInAmps > 0)
                {
                    updateFee(vFeeItemCom, vFeeSched, "FINAL", 1, "N");
                }
            } else if (vUse == "Residential") {
                if (changeInAmps > 0)
                {
                    updateFee(vFeeItemRes, vFeeSched, "FINAL", 1, "N");
                }
            }
        }
        logDebug("End BD_Electrical_Permit_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Electrical_Permit_Fee(), please contact administrator. Error: " + err);
    }
}

