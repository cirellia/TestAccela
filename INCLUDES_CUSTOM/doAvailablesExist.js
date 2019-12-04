function doAvailablesExists() {
        for (var x in inspectionOrderTable) {
            if (inspectionOrderTable[x]["Current Status"] == "Available") {
                return true;
            }
        }
        return false;
    }

}

//CALLED FROM WTUA:BUILDING/TEMPLATE/INSPECTION/NA
