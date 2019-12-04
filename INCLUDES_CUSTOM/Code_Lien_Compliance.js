function Code_Lien_Compliance() {
    try {
        logDebug("Begin Code_Lien_Compliance");
        var LienCompDate = "Lien Compliance Date";
        if (wfTask == "Lien" && wfStatus == "Lien Compliance") {
            editAppSpecific("Lien Compliance Date", dateAdd(null, 0));
        }
        logDebug("End Code_Lien_Compliance");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function Code_Lien_Compliance(), please contact administrator. Error: " + err);
    }
}

