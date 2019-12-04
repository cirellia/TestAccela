function getContactByTypeAA(conType, capId) {
    var contactArray = getPeople(capId);
    for (thisContact in contactArray) {
        if ((contactArray[thisContact].getCapContactModel().getContactType()).toUpperCase() == conType.toUpperCase())
            return contactArray[thisContact].getCapContactModel();
    }
    return false;
}

