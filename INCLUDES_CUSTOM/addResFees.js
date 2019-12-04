function addResFees(){
    logDebug("addResFees() started.");
    try{
        var use = AInfo["Use"];
        var fixturesCount = AInfo["Plumbing Fixture Count"];
        
        if(use == "Residential"){
            if(fixturesCount && parseInt(fixturesCount) > 0){
                updateFee("RESPLFIX", "BD_PERMITS", "FINAL", parseInt(fixturesCount), "N")
            }
            
            updateFee("RESTPOLE", "BD_PERMITS", "FINAL", 1, "N");
            updateFee("DRIVEUSE", "BD_PERMITS", "FINAL", 1, "N");
            updateFee("ZREVBLDG", "BD_PERMITS", "FINAL", 1, "N");
            
            updateFee("WRMETFEE", "IMPACT", "FINAL", 1, "N");
            updateFee("SEWCON", "IMPACT", "FINAL", 1, "N");
        }
    }
    catch(err){
        showMessage = true;;
        comment("Error on custom function addResFees(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber);
        logDebug("Error on custom function addResFees(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("addResFees() ended.");
}

