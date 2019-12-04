function BTR_Renewal_StateLicenseAttached() {
    try {
        logDebug("Begin BTR_Renewal_StateLicenseAttached");
        if (!publicUser) {
            if (!docCheck4ASB("State License")) {
                cancel = true;
                showMessage = true;
                comment("State License document must be attached in order to submit the Renewal application.");
            }
        }
        logDebug("End BTR_Renewal_StateLicenseAttached");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function BTR_Renewal_StateLicenseAttached(), please contact administrator. Error: " + err);
    }
}

// check for document in ASB event
