function getPrimaryAddressLine() { //optional capId parameter
    var itemCap = capId
    if (arguments.length > 1)
        itemCap = arguments[1]; // use cap ID specified in args

    var addResult = aa.address.getAddressByCapId(itemCap);

    if (addResult.getSuccess()) {
        var addArray = addResult.getOutput();
        for (var jj in addArray) {
            var thisAddress = addArray[jj];
            if (thisAddress.getPrimaryFlag() == "Y") {
                return thisAddress.getDisplayAddress();
            }
        }
    } else {
        logDebug("Could not return address: " + addResult.getErrorMessage());
        return false;
    }

    logDebug("Could not find primary address");
    return false;
}

