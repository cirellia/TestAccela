function docUploadedNotification_ACA(){
    if(publicUser){
        var workDesc = workDescGet(capId) == null ? "" : workDescGet(capId);
        var altId = capId.getCustomID();
        var addressLine = "";
        var docCats = "";
        var docFileNams = "";
        var docDescs    = "";

        var adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");
        if (adResult.getSuccess())
            addressLine = adResult.getOutput().getAddressModel();


        var docArray = documentModelArray.toArray();
        for(each in docArray){
            var aDoc = docArray[each];
            docCats = aDoc.getDocCategory();
            docFileNams = aDoc.getFileName();
            docDescs = aDoc.getDocDescription();
        }

        emailParameters = aa.util.newHashtable();
        emailParameters.put("$$PERMITID$$", altId);
        emailParameters.put("$$APPTYPEALIAS$$", cap.getCapType().getAlias());
        emailParameters.put("$$PERMITWRKDESC$$", workDesc);
        emailParameters.put("$$PERMITADDR$$", addressLine);
        emailParameters.put("$$DOCCATEGORY$$", docCats);
        emailParameters.put("$$FILENAME$$", docFileNams);
        emailParameters.put("$$DOCDESC$$", docDescs);


        var userObj = null;
        var asgnUserEmail = null;
        var asgnUser = getAssignedCapUser();
        if((asgnUser, 'asgnUser')) userObj  = aa.person.getUser(asgnUser).getOutput();
        if((userObj, 'userObj')) asgnUserEmail = userObj.getEmail();

        logDebug("asgnUserEmail = " + asgnUserEmail);
        if((asgnUserEmail, 'asgnUserEmail')){
            sendNotification("", asgnUserEmail, "", "DOC_UPLOADED", emailParameters, null);
        }
    }
}//END docUploadedNotification_ACA()


