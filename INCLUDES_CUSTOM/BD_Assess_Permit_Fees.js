function BD_Assess_Permit_Fees() {
    try {
        logDebug("Begin BD_Assess_Permit_Fees");
        loadAppSpecific(AInfo, capId);
        var use = AInfo['Use'];
        var feeSchedule = "BD_PERMITS";
        var feeItemCom = "BPFC";
        var feeItemRes = "BPFR";
        if (feeExists('BPFC')) updateFee('BPFC', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BPFR')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BLPERCER')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BLDSURCH')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (wfTask == "Review Consolidation" && wfStatus == "Completed") {
 	    if (use == "Commercial") {
                updateFee("DRIVEUSE", "BD_PERMITS", "FINAL", 1, "N");
                updateFee("ZREVBLDG", "BD_PERMITS", "FINAL", 1, "N");
                pc = AInfo['Plumbing Fixture Count'];
                if (pc && pc != "")
                	updateFee("COMPLFIX", "BD_PERMITS", "FINAL", parseInt(pc), "N");
	    }
            if (use == "Commercial" || appMatch("Building/Sign/NA/NA")) {
                if (appMatch("Building/Solar/*/*"))
                {
                    updateFee("COMMPHOT", "BD_SOLAR", "FINAL", 1, "N");
                    logDebug("Solar Fee COMMPHOT Assessed");
                }
                else if (appMatch("Building/Reroof/NA/NA"))
                {
                    updateFee("COMMROOF", "BD_REROOF", "FINAL", 1, "N");
                    logDebug("Roofing Fee COMMROOF Assessed");
                }
                else if (appMatch("Building/Building/Accessory Structure/NA"))
                {
                    if (matches(AInfo["Structure Type"],"Pool/Spa"))
                    {
                        updateFee("COMMPOOL", "BD_PERMITS", "FINAL", 1, "N");
                        logDebug("Pool Fee COMMPOOL Assessed");
                    }
                    else{
                        if(!matches(AInfo["Structure Type"],"Fence")){
                            logDebug("Assessing fee for commercial permit");
                            aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                            updateFee(feeItemCom, feeSchedule, 'FINAL', 1, "N");
                        }
                    }
                }
                else if (appMatch("Building/Mechanical/NA/NA"))
                {
                //    updateFee("COMMMECH", "BD_PERMITS", "FINAL", parseInt(AInfo["Tons"]), "N");
                //    logDebug("Comm Mechanical Fee COMMMECH Assessed for " + AInfo["Tons"] + " tons.");
                }
                else if (appMatch("Building/Plumbing/NA/NA") && parseInt(AInfo["Gas Outlets"]))
                {
                    updateFee("GASFEE", "BD_PLUMBING", "FINAL", parseInt(AInfo["Gas Outlets"]), "N");
                    logDebug("Gas Fee GASFEE Assessed for " + AInfo["Gas Outlets"] + " gas outlets.");
                }
                else
                {
                    // Ensure an Electrical Permit Fee is not assessed before adding one for Building, and don't add one for fencing
                    if ( ! (feeExists('COMMELEC') || feeExists('COMELECT') || feeExists('COMELEC')) && !(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")) )
                    {
                        aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                        updateFee(feeItemCom, feeSchedule, 'FINAL', 1, "N");
                        logDebug("BD Fee BPFC Assessed");
                    }
                    else
                        logDebug("Skipping assessing the Building Permit Fee.");
                }
            }
            else if (use == "Residential") {
                if (appMatch("Building/Solar/*/*"))
                {
                    updateFee("RESPHOTO", "BD_SOLAR", "FINAL", 1, "N");
                    logDebug("Solar Fee RESPHOT Assessed");
                }
                else if (appMatch("Building/Reroof/NA/NA"))
                {
                    updateFee("RESROOF", "BD_REROOF", "FINAL", 1, "N");
                    logDebug("Roofing Fee RESROOF Assessed");
                }
                else if (appMatch("Building/Building/Accessory Structure/NA"))
                {
                    if (matches(AInfo["Structure Type"],"Pool/Spa"))
                    {
                        updateFee("REUNDGRD", "BD_PERMITS", "FINAL", 1, "N");
                        logDebug("Res Underground Pool Fee REUNDGRD Assessed");
                    }
                    else{
                        if(!matches(AInfo["Structure Type"],"Fence")){
                            logDebug("Adding Residential Permit fee")
                            aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                            updateFee(feeItemRes, feeSchedule, 'FINAL', 1, "N");
                        }
                    }
                }
                else if (appMatch("Building/Mechanical/NA/NA"))
                {
                    //updateFee("RESMECH", "BD_PERMITS", "FINAL", parseInt(AInfo["Tons"]), "N");
                    //logDebug("Res Mechanical Fee RESMECH Assessed for " + AInfo["Tons"] + " tons.");
                }
                else if (appMatch("Building/Plumbing/NA/NA") && parseInt(AInfo["Gas Outlets"]))
                {
                    updateFee("GASFEE", "BD_PLUMBING", "FINAL", parseInt(AInfo["Gas Outlets"]), "N");
                    logDebug("Gas Fee GASFEE Assessed for " + AInfo["Gas Outlets"] + " gas outlets.");
                }
                else
                {
                    // Ensure an Electrical Permit Fee is not assessed before adding one for Building
                    if ( ! (feeExists('RESELEC') || feeExists('RESELECL') || feeExists('RESELECH')) && !(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")) )
                    {
                        aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                        updateFee(feeItemRes, feeSchedule, 'FINAL', 1, "N");
                        logDebug("BD Fee BPFR Assessed");
                    }
                    else
                        logDebug("Skipping assessing the Building Permit Fee.");
                }
            }

            if (!(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")))
            {
                updateFee('BLPERCER', feeSchedule, 'FINAL', 1, "N");
                updateFee('BLDSURCH', feeSchedule, 'FINAL', 1, "N");
            }

            if (appMatch("Building/Sign/NA/NA") || (appMatch("Building/Building/Accessory Structure/NA") && !matches(AInfo["Structure Type"],"Fence","Retaining Wall","Shed","Slab / Driveway")) )
            {
                updateFee("ZREVBLDG", "BD_PERMITS", "FINAL", 1, "N");
                logDebug("Zoning Fee ZREVBLDG Assessed");
            }
            if (appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence","Retaining Wall","Shed","Slab / Driveway"))
            {
                updateFee("ZREVFNCE", "BD_PERMITS", "FINAL", 1, "N");
                logDebug("Zoning Fee ZREVFNCE Assessed");
            }

        }
        logDebug("End BD_Assess_Permit_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Assess_Permit_Fees(), please contact administrator. Error: " + err);
    }
}

