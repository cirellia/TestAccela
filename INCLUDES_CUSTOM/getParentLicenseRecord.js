function getParentLicenseRecord(childAppID)
{
    //Get the Cap Type
    var capScriptModel = aa.cap.getCap(childAppID).getOutput();
    var capTypeModel = capScriptModel.getCapType();
    var recordType = capTypeModel.getCategory();

    //If cap is a renewal then retrieve the parent using aa.cap.getProjectByChildCapID()
    if(recordType == "Renewal")
    {
        var parentListResult = aa.cap.getProjectByChildCapID(childAppID,"Renewal",null);
        if(parentListResult.getSuccess())
        {
            var parentList = parentListResult.getOutput();
            if(parentList.length){
                parentPrj= parentList[0].getProjectID();
                    parentCapId = aa.cap.getCapID(parentPrj.getID1(),parentPrj.getID2(),parentPrj.getID3()).getOutput();
                    return parentCapId;
            }
        }
        logDebug("Error Retrieving the Parent License Record for Child Record: "+childAppID+" "+parentListResult.getErrorMessage());
    }
    //Use aa.cap.getProjectParents() to retrieve the parent for non renewal records
    else
    {
        var i = 1;
        var parentListResult = aa.cap.getProjectParents(childAppID,i);
        if(parentListResult.getSuccess())
        {
            var parentList = parentListResult.getOutput();
            if (parentList.length)
                return parentList[0].getCapID();
        }
        else
        {
            logDebug("**WARNING: GetParent found no project parent for this application: "+childAppID+" "+parentListResult.getErrorMessage());
        }
    }
}

