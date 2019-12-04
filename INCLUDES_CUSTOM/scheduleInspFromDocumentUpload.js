function scheduleInspFromDocumentUpload(capId){
    try{
        logDebug("Begin Function: scheduleInspFromDocumentUpload(capId:" + capId + ")");

        //if (publicUser) // only works in AA, not ACA
        //{

            var documentList = documentModelArray;
            if (!documentList) {
                aa.sendEmail("DoNotReply@DeLand.org", "Cirellia@deland.org", "", "DUA:BUILDING/*/*/* Event", "Message: " + message + " Debug: " + debug + " DocList was null!", null);
                return false;
            } else {

                for (var counter = 0; counter < documentList.size() ; counter++) {
                    var doc = documentList.get(counter);
                    if (doc.getDocCategory() != "") {
                        logDebug("document category: " + doc.getDocCategory());
                        scheduleInspection(doc.getDocCategory(), 1);
                    }
                }
            }
        //}

        logDebug("End Function: scheduleInspFromDocumentUpload(capId:" + capId + ")");
    }
    catch(err){
        showMessage = true;
        logDebug("Error on DUA Event custom function scheduleInspFromDocumentUpload(). Please contact administrator. Err: " + err);
    }

    aa.sendEmail("DoNotReply@DeLand.org", "Cirellia@deland.org", "", "DUA:BUILDING/*/*/* Event", "Message: " + message + " Debug: " + debug, null);

}

