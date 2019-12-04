function PL_SitePlan_Application_Fees() {
    try {
        logDebug("Begin PL_SitePlan_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Site Plan Class"];
        var acres = 1;
        var acresValue = AInfo["Acres"];
        var gfa = AInfo["Gross Floor Area"];
        var propUse = AInfo["Proposed Project Type"];
        var NumofUnit = 1;
        var NumofUnitValue = AInfo["Number of Units"];

        if((acresValue != "" && acresValue != undefined && acresValue != null, 'acres is not null'))
            acres = parseFloat(AInfo["Acres"]);

        if((NumofUnitValue != "" && NumofUnitValue != undefined && NumofUnitValue != null, 'NumofUnitValue is not null'))
            NumofUnit = parseFloat(NumofUnitValue);

        if ((applType == "Concept Plan",'applType == "Concept Plan"')) {
            updateFee("CPAPP", "PL_MAIN", "FINAL", 1, "N");
        }
        if ((applType == "Class II",'applType == "Class II"')) {
            updateFee("SPCLASS2", "PL_MAIN", "FINAL", 1, "N");
        }
        if ((propUse != "Multi-Family", 'propUse != "Multi-Family"')) {
            if ((applType == "Class III",'applType == "Class III"')) {
                updateFee("SPCLASS3", "PL_MAIN", "FINAL", gfa, "N");
            }
            if ((applType == "Class IV",'applType == "Class IV"')) {
                updateFee("SPCLASS4", "PL_MAIN", "FINAL", gfa, "N");
            }
        }
        if ((propUse == "Multi-Family", 'propUse == "Multi-Family"')) {
            if ((applType == "Class III",'applType == "Class III"')) {
                updateFee("SPMULTI", "PL_MAIN", "FINAL", NumofUnit, "N");
            }
            if ((applType == "Class IV",'applType == "Class IV"')) {
                updateFee("SPMULTI", "PL_MAIN", "FINAL", NumofUnit, "N");
            }
        }
        logDebug("End PL_SitePlan_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_SitePlan_Application_Fees(), please contact administrator. Error: " + err);
    }
}

