function scheduleInspectionsIRSA() {
    var inspectionOrderTable,
        maxCompletedMax = 0,
        minNonCompletedMin = 0;

    try {
        logDebug("Begin scheduleInspectionsIRSA");
        inspectionOrderTable = loadASITable("INSPECTION ORDER");
        if (typeof (inspectionOrderTable) == "object") {
            updateInspTableWithLatestInspResult();
            maxCompletedMax = getMaxCompletedMax();
            aa.print('maxCompletedMax - ' + maxCompletedMax);
            minNonCompletedMin = getMinNonCompletedMin();
            aa.print('minNonCompletedMin - ' + minNonCompletedMin);
            if (!doAvailablesExists() && getMinNonCompletedMax() > minNonCompletedMin) {
                maxCompletedMax = getMinNonCompletedMax();
                aa.print('maxCompletedMax2 - ' + maxCompletedMax);
                minNonCompletedMin = getMinNonCompletedMin();
                aa.print('minNonCompletedMin2 - ' + minNonCompletedMin);
            }
            setAvailables();

            aa.print('maxCompletedMax - ' + maxCompletedMax);
            aa.print('minNonCompletedMin - ' + minNonCompletedMin);

            removeASITable('INSPECTION ORDER');
            addASITable('INSPECTION ORDER', inspectionOrderTable);
        }
        logDebug("End scheduleInspectionsIRSA");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: IRSA function scheduleInspectionsIRSA(), please contact administrator. Error: " + err);
    }



