function docCheck4ASB(docName) {
    try {
        var docAttached = false;

        if (!publicUser) // only works in AA, not ACA
        {
            var documentList = aa.env.getValue("DocumentModelList");
            if (!documentList) {
                return false;
            } else {
                for (var counter = 0; counter < documentList.size() ; counter++) {
                    var doc = documentList.get(counter);
                    if (doc.getDocCategory() == docName) {
                        docAttached = true;
                        break;
                    }
                }
            }
        } else {
            docAttached = true;
        }
        return docAttached;
    } catch (error) {
        cancel = true;
        showMessage = true;
        comment(error.message);
        comment("An error occurred while retrieving the document array");
    }
}

