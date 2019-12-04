function assessImpactFees() {
    try {
        logDebug("Begin assessImpactFees");
        loadAppSpecific(AInfo, capId);
        var calcImpactFees = AInfo["Calculate Impact Fees"];
        var waterFixtureCount = AInfo["Water Fixture Count"];
        var sewerFixtureCount = AInfo["Sewer Fixture Count"];
        var policeImpactCat = AInfo["Police Impact Category"];
        var fireImpactCat = AInfo["Fire Impact Category"];
        var retailImpactCat = AInfo["Retail Impact Category"];
        var instituionImpactCat = AInfo["Institution Impact Category"];
        var industrialImpactCat = AInfo["Industrial Impact Category"];
        var recreationalImpactCat = AInfo["Recreational Impact Category"];
        var transientAssistedHomeCat = AInfo["TAH Category"];
        var parkRecImpactFee = AInfo["Park and Rec Category"];
        //var residentialGovernment = AInfo["Use"];
        var officeImpact = AInfo["Office Impact Category"];
        var impactUnits = AInfo["Impact Units"];
        var officeSquareFeet = AInfo["Office Square Feet"];
        var retailSquareFeet = AInfo["Retail Square Feet"];
        var institutionSquareFeet = AInfo["Institution Square Feet"];
        var industrialSquareFeet = AInfo["Industrial Square Feet"];
        var recreationalQuantity = AInfo["Recreational Quantity"];
        var numberOfPumps = AInfo["Retail Quantity"];
        var numberOfStudents = AInfo["Students"];
        var numberOfBeds = AInfo["TAH Quantity"];

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
                        //updateFee(policeLookUpFee, "IMPACT", "FINAL", impactUnits, "N");
                        updateFee(policeLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess fire impact cat fee
                if (fireImpactCat) {
                    var fireLookUpFee = lookup("Fire_Impact_Category", fireImpactCat);
                    if (fireLookUpFee) {
                        //updateFee(fireLookUpFee, "IMPACT", "FINAL", impactUnits, "N");
                        updateFee(fireLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                if (parkRecImpactFee) {
                    if (parkRecImpactFee == "Multi-Family") {
                        updateFee("MFPKREC", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Mobile Home") {
                        updateFee("MHPKREC", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Single Family Attached") {
                        updateFee("PARKRECSFA", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Single Family Detached") {
                        updateFee("PARKRECSFD", "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess Residential Government Impact Fee
                if (AInfo["Use"] == "Residential") {
                    updateFee("GOVIMP", "IMPACT","FINAL", 1, "N");
                }
		if (AInfo["Use"] == "Commercial") {
                	updateFee("SEWCON", "IMPACT", "FINAL", 1, "N");
                	updateFee("RECLMETER", "IMPACT", "FINAL", 1, "N");
                	updateFee("WRMETFEE", "IMPACT", "FINAL", 1, "N");
                }	
                //assess office impact
                if (officeImpact == "Office") {
                    updateFee("OFFICE", "IMPACT", "FINAL", 1, "N");
                }
                if (officeImpact == "Medical Office") {
                    updateFee("OFFICMED", "IMPACT", "FINAL", officeSquareFeet / 1000, "N");
                }
                //assess Retail impact cat fee
                if (retailImpactCat) {
                    var retailImpactCatFee = lookup("BD_Impact_RetailCategory", retailImpactCat);
                    var totalFee = parseFloat(retailSquareFeet / 1000);
                        if (retailImpactCatFee == "RTLGASIM") {
                            updateFee(retailImpactCatFee, "IMPACT", "FINAL", numberOfPumps, "N");
                        }

                        if (retailImpactCatFee == "RETLIMP") {
                            var totalFeeLimp = 0;
                            if (retailImpactCat == "Retail - up to 50,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 547.59);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }

                            if (retailImpactCat == "Retail - 50,000 - 200,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 520.64);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }

                            if (retailImpactCat == "Retail - over 200,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 445.19);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }
                        }
                     else {
                        updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFee, "N");
                    }
                }
                //assess institution impact cat  fee
                if (instituionImpactCat) {
                    var totalInstFee = parseFloat(institutionSquareFeet / 1000);
                    var institutionImpactCatFee = lookup("BD_Impact_Institutions", instituionImpactCat);
                    if (matches(institutionImpactCatFee, "INSCHR", "INSHOSP")) {
                        updateFee(institutionImpactCatFee, "IMPACT", "FINAL", totalInstFee, "N");
                    }
                    else {
                        updateFee(institutionImpactCatFee, "IMPACT", "FINAL", numberOfStudents, "N");
                    }
                }

                //assess Industrial Impact Cat Fee
                if (industrialImpactCat) {
                    var totalIndFee = parseFloat(industrialSquareFeet / 1000);
                    var industrialImpactCatFee = lookup("BD_Impact_IndustrialCategory", industrialImpactCat);
                    if (industrialImpactCatFee) {
                        updateFee(industrialImpactCatFee, "IMPACT", "FINAL", totalIndFee, "N");
                    }
                }

                //assess Recreatinal Impact Cat
                if (recreationalImpactCat) {
                    var totalIndFee = parseFloat(recreationalQuantity);
                    var recreationalImpactCatFee = lookup("BD_Impact_Recreational", recreationalImpactCat);
                    if (recreationalImpactCatFee) {
                        updateFee(recreationalImpactCatFee, "IMPACT", "FINAL", totalIndFee, "N");
                    }
                }

                //assess Transient Assiste Impact Fee transientAssistedHomeCat
                if (transientAssistedHomeCat) {
                    var totalTranFee = parseFloat(numberOfBeds);
                    var transientImpactCatFee = lookup("BD_Impact_TAHCategory", transientAssistedHomeCat);
                    if (transientImpactCatFee) {
                        updateFee(transientImpactCatFee, "IMPACT", "FINAL", totalTranFee, "N");
                    }
                }
            }
        }
        logDebug("End assessImpactFees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function assessImpactFees(), please contact administrator. Error: " + err);
    }
}

