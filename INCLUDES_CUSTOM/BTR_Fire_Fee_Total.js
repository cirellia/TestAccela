function BTR_Fire_Fee_Total() {
    try {
        var asiTableNam = "BTR FIRE";
        var TotalFireFees = "Total Fire Fees";
        var btrFireTable = loadASITable(asiTableNam);
        var finalFeeAmt = 0;
        if (btrFireTable) {
            var tableLength = btrFireTable.length;
            if (tableLength > 0) {
                for (eachRow in btrFireTable) {
                    var trade = parseFloat(btrFireTable[eachRow]["Fire Fee"]);
                    finalFeeAmt = parseFloat(finalFeeAmt + trade);
                }
            }
        }
        if (finalFeeAmt > 0) {
            editAppSpecific(TotalFireFees, finalFeeAmt, capId);
            aa.print("Total Fire Fees updated to : " + finalFeeAmt);
        }
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA custom function BTR_Fire_Fee_Total(). Please contact administrator. Err: " + err);
    }
}

