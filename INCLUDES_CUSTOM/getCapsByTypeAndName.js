function getCapsByTypeAndName(grp, typ, subTyp, cat, name) {
    var matchingCapIds = [];
    if (!grp || !typ) {
        throw "ERROR: getCapsByTypeAndName() - group  type are mandatory";
    }

    getCapResult = aa.cap.getByAppType(grp, typ);
    if (getCapResult.getSuccess()) {
        var apsArray = getCapResult.getOutput();
        for (var aps in apsArray) {
            var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();    //CapScriptModel
            var myTypeArray = myCap.getCapType().getValue().split("/");
            if ((!subTyp || myTypeArray[2] == subTyp) && (!cat || myTypeArray[3] == cat)) {
                if (myCap.getSpecialText() && myCap.getSpecialText().toUpperCase() == name.toUpperCase()) {
                    matchingCapIds.push(apsArray[aps].getCapID());
                }
            }
        }
    }
    return matchingCapIds;
}

