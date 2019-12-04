function BD_Submittal_Fee() {
    try {
        loadAppSpecific(AInfo, capId);
        var use = AInfo['Use'];
        if (feeExists('RESASUB')) updateFee('RESASUB', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('COMMASUB') && !appMatch("Building/Sign/NA/NA")) updateFee('COMMASUB', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (use) {
            if (use == "Commercial" || appMatch("Building/Sign/NA/NA")) {
                updateFee('COMMASUB', 'BD_PERMITS', 'FINAL', 1, "Y");
            }
            else {
                updateFee('RESASUB', 'BD_PERMITS', 'FINAL', 1, "Y");
            }
        }
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Submittal_Fee(), please contact administrator. Error: " + err);
    }
}

