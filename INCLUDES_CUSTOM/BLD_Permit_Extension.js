function BLD_Permit_Extension() {
    try {
        var tester = docCheck4ASB("Permit Extension Request");
        logDebug("Begin BLD_Permit_Extension");
        if (!publicUser) {
            if (tester) {
                delandTaskAssign("Review Consolidation", "Building");
            }
        }
        logDebug("End BLD_Permit_Extension");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function BLD_Permit_Extension(), please contact administrator. Error: " + err);
    }
}

