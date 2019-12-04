function feeItemsOnCap() {
    var itemCap = capId
    if (arguments.length > 0)
        itemCap = arguments[0]; // use cap ID specified in args
    var feeResult = aa.fee.getFeeItems(itemCap);
    if (feeResult.getSuccess()) {
        var feeObjArr = feeResult.getOutput();
        if (feeObjArr.length > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        logDebug("**ERROR: getting fee items: " + capContResult.getErrorMessage());
        return false
    }
}

