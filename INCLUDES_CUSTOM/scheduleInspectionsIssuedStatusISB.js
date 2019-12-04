function scheduleInspectionsIssuedStatusISB() {
    try {
        if (!matches(capStatus, "Issued")) {
            cancel = true;
            showMessage = true;
            comment("No inspections can be scheduled until permit has been issued. Please contact Permit Clerks at 386-626-7006 to get more information");
        }
        if (balanceDue > 0) {
            cancel = true;
            showMessage = true;
            comment("All fees must be paid prior to scheduling inspections. Please contact Permit Clerks at 386-626-7006 to get more information");
        }
        logDebug("End scheduleInspectionsIssuedStatusISB()");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsIssuedStatusISB(), please contact administrator. Error: " + err);
    }
}

