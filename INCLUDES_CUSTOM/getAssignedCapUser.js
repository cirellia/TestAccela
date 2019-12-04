function getAssignedCapUser(){
    var itemCap = capId
    if (arguments.length > 0) itemCap = arguments[0]; // use cap ID specified in args

    var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
    if (!cdScriptObjResult.getSuccess())
        { logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

    var cdScriptObj = cdScriptObjResult.getOutput();

    if (!cdScriptObj)
        { logDebug("**ERROR: No cap detail script object") ; return false; }

    cd = cdScriptObj.getCapDetailModel();

    return cd.getAsgnStaff();

}//END getAssignedCapUser()

