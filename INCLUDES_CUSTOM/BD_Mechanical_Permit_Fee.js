function BD_Mechanical_Permit_Fee() {
    try {
        logDebug("Begin BD_Mechanical_Permit_Fee");
        loadAppSpecific(AInfo, capId);
        var vUse = AInfo["Use"];
        var tons = AInfo["Tons"];
        var vFeeItemCom = "COMMMECH";
        var vFeeItemRes = "RESMECH";
        var vFeeSched = "BD_MECHANICAL";
        if (wfTask == "Mechanical" && wfStatus == "Approved") {
        
          if(!tons || tons == 0) tons = -1;
          if (tons)
          {
            if (vUse == "Commercial") {
                updateFee(vFeeItemCom, vFeeSched, "FINAL", tons, "N");
            } else if (vUse == "Residential") {
                updateFee(vFeeItemRes, vFeeSched, "FINAL", tons, "N");
            }
          }
          else
          {
            if (vUse == "Commercial") {
                updateFee("BPFC", "BD_PERMITS", "FINAL", 1, "N");
            } else if (vUse == "Residential") {
                updateFee("BPFR", "BD_PERMITS", "FINAL", 1, "N");
            }
          }
        }
        logDebug("End BD_Mechanical_Permit_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Mechanical_Permit_Fee(), please contact administrator. Error: " + err);
    }
}
