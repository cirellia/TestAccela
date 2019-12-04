function ASA_Update_Application_Expiration() {
    try {
        logDebug("begin function ASA_Update_Application_Expiration");
        editAppSpecific("Application Expiration Date", dateAdd(null, 180));
        logDebug("End function ASA_Update_Application_Expiration");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function ASA_Update_Application_Expiration(). Please contact administrator. Err: " + err);
    }
}

