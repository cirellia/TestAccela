function capIdsGetByAddr4ServiceRequest4ASB(streetName, HouseNumberStart, StreetSuffix, Zip, StreetDirection) {
    //Gets CAPs with the same address as the current CAP, as capId (CapIDModel) object array (array includes current capId)
    //07SSP-00034/SP5015
    //

    //Get address(es) on current CAP
    /*var addrResult = aa.address.getAddressByCapId(capId);
    if (!addrResult.getSuccess()) {
        aa.print("**ERROR: getting CAP addresses: " + addrResult.getErrorMessage());
        return false;
    }

    var addrArray = new Array();
    var addrArray = addrResult.getOutput();
    if (addrArray.length == 0 || addrArray == undefined) {
        aa.print("The current CAP has no address.  Unable to get CAPs with the same address.")
        return false;
    }
    */
    //use 1st address for comparison
    var streetName = streetName;
    var hseNum = HouseNumberStart;
    var streetSuffix = StreetSuffix;
    var zip = Zip;
    var streetDir = StreetDirection;

    if (streetDir == "")
        streetDir = null;
    if (streetSuffix == "")
        streetSuffix = null;
    if (zip == "")
        zip = null;

    if (hseNum && !isNaN(hseNum)) {
        hseNum = parseInt(hseNum);
    } else {
        hseNum = null;
    }

    var capArray = new Array();
    // get caps with same address
    if (streetName != null || hseNum != null || streetSuffix != null || zip != null || streetDir != null) {
        var capAddResult = aa.cap.getCapListByDetailAddress(streetName, hseNum, streetSuffix, zip, streetDir, null);
        if (capAddResult.getSuccess())
            capArray = capAddResult.getOutput();
        else {
            aa.print("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());
            return false;
        }
    }

    var capIdArray = new Array();
    //convert CapIDScriptModel objects to CapIDModel objects
    for (i in capArray)
        capIdArray.push(capArray[i].getCapID());

    if (capIdArray)
        return (capIdArray);
    else
        return false;
}

