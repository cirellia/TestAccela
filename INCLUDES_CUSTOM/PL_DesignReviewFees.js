function PL_DesignReviewFees(){
    try {
        logDebug("Begin SitePlan_Design Review");
        loadAppSpecific(AInfo, capId);
        var assessStdRevFee = AInfo["Assess Standards Review Fees"];
        var typeSite=AInfo["Type of Site Plan"];
        var sitPlanClass = AInfo["Site Plan Class"]
        var acreDRFee=AInfo["DR Per Acre Fee"];
        var repetitiveDRFee=AInfo["Repetitive Design Review Fee"];
        var exteriorPlanFee=AInfo["Site Plan Exterior Plan Fee"];
        var existingUse = AInfo["Existing Use"];

        //var vFeeSched = "PL_SITEPLAN";
        var vFeeSched = "PL_MAIN";
        
        if((typeSite == "Concept Plan", 'typeSite == "Concept Plan"')){
            updateFee("CPAPP", vFeeSched, "FINAL", 1, "N");
        }
        
        if((sitPlanClass == "Class II", 'sitPlanClass == "Class II"')){
            updateFee("SPCLASS2", vFeeSched, "FINAL", 1, "N");
        }
        
        if((sitPlanClass == "Class III" && existingUse != "Multiple-family dwellings", 'sitPlanClass == "Class III" && existingUse != "Multiple-family dwellings"')){
            if(AInfo["Acres"] != null) updateFee("SPCLASS3", vFeeSched, "FINAL", parseFloat(AInfo["Acres"]), "N");
        }
        
        if((sitPlanClass == "Class IV" && existingUse != "Multiple-family dwellings", 'sitPlanClass == "Class IV" && existingUse != "Multiple-family dwellings"')){
            if(AInfo["Acres"] != null) updateFee("SPCLASS4", vFeeSched, "FINAL", parseFloat(AInfo["Acres"]), "N");
        }
        
        if((matches(sitPlanClass, "Class III","Class IV") && existingUse == "Multiple-family dwellings",
                 'matches(sitPlanClass, "Class III","Class IV") && existingUse == "Multiple-family dwellings"')){
            if(AInfo["Number of Units"] != null) updateFee("SPMULTI", vFeeSched, "FINAL", parseFloat(AInfo["Number of Units"]), "N");
        }
        
        //if ((assessStdRevFee == "Yes", 'assessStdRevFee == "Yes"')) {
        //    updateFee("STDREVSP", vFeeSched, "FINAL", acreDRFee, "N");
        //    if(exteriorPlanFee != 0 || extPerimTotal !=null)
        //        updateFee("STDREVEXTER",vFeeSched,"FINAL", exteriorPlanFee,"N");
        //    if(repetitiveDRFee != 0 || repetitiveDRFee !=null)
        //        updateFee("STDREVCLUST", vFeeSched,"FINAL", repetitiveDRFee,"N");
        //    if(typeSite = "Class II"){
        //        updateFee("PBCDSR12", vFeeSched, "FINAL",1, "N");
        //    }
        //    else {
        //        updateFee("PBCDSR34", vFeeSched, "FINAL", 1, "N");
        //    }
        //}
        logDebug("End PL_SitePlan_Design Review");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PL_SitePlan_Design Review Fees. Contact your system administrator. " + err.message);
    }
}
