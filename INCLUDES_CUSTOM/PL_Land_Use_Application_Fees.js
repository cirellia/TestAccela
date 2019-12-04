function PL_Land_Use_Application_Fees() {
    try {
        aa.print("Begin PL_Land_Use_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Application Type"];
        var acres = 1;
        var acresValue = AInfo["Acres"];
        var vFeeSched = "PL_MAIN";

        if((acresValue != "" && acresValue != undefined && acresValue != null, 'acres is not null'))
            acres = parseFloat(AInfo["Acres"]);

        if ((applType == "Text Change", 'applType == "Text Change"')) {
            updateFee("CLUPCHANGE", vFeeSched, "FINAL", 1, "N");
        }
        if ((applType == "Large Scale Land Use", 'applType == "Large Scale Land Use"')) {
            updateFee("LUAPP", vFeeSched, "FINAL", acres, "N");
        }
        if ((applType == "Small Scale Land Use", 'applType == "Small Scale Land Use"')) {
            updateFee("SMLUAPP", vFeeSched, "FINAL", acres, "N");
        }
        aa.print("End PL_Land_Use_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Land_Use_Application_Fees(), please contact administrator. Error: " + err);
    }
}

