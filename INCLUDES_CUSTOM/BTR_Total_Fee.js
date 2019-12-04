function BTR_Total_Fee() {
    try {
        logDebug("begin BTR_Total_Fee");
        var asiTableNam = "BTR";
        var BTRTotalFireFees = "BTR Total License Fee";
        var btrTable = loadASITable(asiTableNam);
        var finalFeeAmt = 0;
        if (btrTable) {
            var tableLength = btrTable.length;
            if (tableLength > 0) {
                for (eachRow in btrTable) {
                    var baseFee = parseFloat(btrTable[eachRow]["Assessed Fee"]);
                    finalFeeAmt = parseFloat(finalFeeAmt + baseFee);
                }
            }
        }
        if (finalFeeAmt > 0) {
            editAppSpecific(BTRTotalFireFees, finalFeeAmt);
            aa.print("Total Fire Fees updated to : " + finalFeeAmt);
        }
        logDebug("End BTR_Total_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA custom function BTR_Total_Fee(). Please contact administrator. Err: " + err);
    }
}

// Evaluate Enforcement table.  Generate report if any row has status of In Violation and Initial Issued not checked
