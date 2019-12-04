function getRenewalCapByParentCapID(parentCapid){

    if (parentCapid == null || aa.util.instanceOfString(parentCapid)){
        return null;
    }

    var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Incomplete");

    if(result.getSuccess()){
        projectScriptModels = result.getOutput();
        if (projectScriptModels == null || projectScriptModels.length == 0){
            logDebug("(getRenewalCapByParentCapID) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")");
            return null;
        }
        
        projectScriptModel = projectScriptModels[0];

        return projectScriptModel;
    }  
    else{
        logDebug("(getRenewalCapByParentCapID) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")" + result.getErrorMessage());
        return null;
    }
}

