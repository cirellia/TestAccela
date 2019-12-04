function setRenewal2Incomplete(itemCap){
    logDebug("setRenewal2Incomplete() started");
    try{
        var parentCapid = getParentLicenseCapID(itemCap);
        var thisRes = aa.cap.getProjectByMasterID(parentCapid, "Renewal", null);
        
        if(thisRes.getSuccess()){
            projectScriptModels = thisRes.getOutput();
            if (projectScriptModels == null || projectScriptModels.length == 0){
                logDebug("(setRenewal2Incomplete) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")");
                return null;
            }
            
            for(each in projectScriptModels){
                var aModel = projectScriptModels[each];
                if(aModel.capID.toString() == itemCap.toString()){
                    aModel.setStatus("Incomplete");
                    var updateRes = aa.cap.updateProject(aModel);
                    if(updateRes.getSuccess()){
                        logDebug("Updated status to imcomplete for altId: " + itemCap.getCustomID());
                        logDebug("setRenewal2Incomplete() ended");
                        return true;
                    }
                    else{
                        logDebug("ERROR: Unable to update status for altId: " + itemCap.getCustomID() + ". Error: " + updateRes.getErrorMessage());
                        logDebug("setRenewal2Incomplete() ended");
                        return false;
                    }
                }
            }
        }  
        else{
            logDebug("(setRenewal2Incomplete) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")" + thisRes.getErrorMessage());
            return null;
        }
    }
    catch(err){
        showMessage = true;;
        comment("Error on custom function (). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber);
        logDebug("Error on custom function (). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("setRenewal2Incomplete() ended");
}//END setRenewal2Incomplete()

