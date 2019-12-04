function assessNewImpactFees() {
    try {
        logDebug("Begin assessImpactFees");
        //loadAppSpecific(AInfo, capId);
        var calcImpactFees = AInfo["Calculate Impact Fees"];
        var waterFixtureCount = AInfo["Water Fixture Count"];
        var sewerFixtureCount = AInfo["Sewer Fixture Count"];
        var policeImpactCat = AInfo["Police Impact Category"];
        var fireImpactCat = AInfo["Fire Impact Category"];;
        var parkRecImpactCat = AInfo["Park and Rec Category"];
        var impactUnits = AInfo["Impact Units"];
        var govImpactCat = AInfo["Government Impact Category"];
        

        if (wfTask == "Review Consolidation" && wfStatus == "Completed") {
            if (calcImpactFees == "Yes") {
                //assess water fixture fee
                if (waterFixtureCount && parseFloat(waterFixtureCount) > 0) {
                    updateFee("NEWWIF", "IMPACT", "FINAL", waterFixtureCount, "N");
                }
                //assess sewer fixture fee
                if (sewerFixtureCount && parseFloat(sewerFixtureCount) > 0) {
                    updateFee("NEWSIF", "IMPACT", "FINAL", sewerFixtureCount, "N");
                }
                //assess police impact cat fee
                if (policeImpactCat) {
                    var policeLookUpFee = lookup("BD_Impact_PoliceCategory", policeImpactCat);
                    if (policeLookUpFee) {
                        updateFee(policeLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess fire impact cat fee 
                if (fireImpactCat) {
                    var fireLookUpFee = lookup("Fire_Impact_Category", fireImpactCat);
                    if (fireLookUpFee) {
                        updateFee(fireLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                if (parkRecImpactCat) {
                    var parkLookUpFee = lookup("BD_ParkRecCategory", parkRecImpactCat);
                    if (parkLookUpFee) {
                        updateFee(parkLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess  Government Impact Fee
                if (govImpactCat) {
                    var govLookUpFee = lookup("BD_Government_Impact Category", govImpactCat);
                    if (govLookUpFee) {
                        updateFee(govLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                if (AInfo["Use"] == "Commercial") {
                	updateFee("SEWCON", "IMPACT", "FINAL", 1, "N");
                	updateFee("RECLMETER", "IMPACT", "FINAL", 1, "N");
                	updateFee("WRMETFEE", "IMPACT", "FINAL", 1, "N");
                	
                }      
            }
        }
        logDebug("End assessImpactFees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR:  function assessNewImpactFees(), please contact administrator. Error: " + err);
    }
}


