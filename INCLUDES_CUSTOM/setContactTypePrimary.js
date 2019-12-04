function setContactTypePrimary(pContactType,pPrimary) {
    var itemCapId = (arguments.length == 3) ? arguments[2] : capId;
    var vPrimary = matches(pPrimary,"Y",true,"true") ? true : false;

    var vContactObj = new getContactObj(itemCapId, pContactType);

    vContactObj.primary = vPrimary;
    vContactObj.save();
}

