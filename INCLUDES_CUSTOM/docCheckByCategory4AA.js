function docCheckByCategory4AA(docCategory){
    var attachedDocs = getDocumentList();
    for(idx in attachedDocs){
        var aDoc = attachedDocs[idx];
        
        if(aDoc.getDocCategory() == docCategory) 
            return true;
    }
    
    return false;
}


/**
 * Notification to Applicant when Inspection is resulted
 * @conType (String) Contact type to be notified.
 */
