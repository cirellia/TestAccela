function loadASITables4ACAXX(tname) {
    //
    // Loads App Specific tables into their own array of arrays.  Creates global array objects
    //
    // Optional parameter, cap ID to load from.  If no CAP Id specified, use the capModel
    //
    var itemCap = capId;
    if (arguments.length == 2) {
       itemCap = arguments[1]; // use cap ID specified in args
       var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
    } else {
       var gm = cap.getAppSpecificTableGroupModel()
    }
    var tempArray = [];
    if(gm){
        var ta = gm.getTablesMap();
        var tai = ta.values().iterator();
        while (tai.hasNext()) {
            var tsm = tai.next();
            if (tsm.rowIndex.isEmpty()) continue; // empty table

            var tempObject = new Array();
            var tempArray = new Array();
            var tn = tsm.getTableName();

            if (!tn.equals(tname)) continue;

            if (tsm.rowIndex.isEmpty())
            {
                logDebug("Couldn't load ASI Table " + tname + " it is empty");
                return false;
            }

            var tempObject = new Array();
            var tempArray = new Array();

            var tsmfldi = tsm.getTableField().iterator();
            var tsmcoli = tsm.getColumns().iterator();
            //var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
            var numrows = 1;
            while (tsmfldi.hasNext()) // cycle through fields
            {
                if (!tsmcoli.hasNext()) // cycle through columns
                {
                    var tsmcoli = tsm.getColumns().iterator();
                    tempArray.push(tempObject); // end of record
                    var tempObject = new Array(); // clear the temp obj
                    numrows++;
                }

                var tcol = tsmcoli.next();
                var tval = tsmfldi.next();
                var readOnly = 'N';
                //if (readOnlyi.hasNext()) {
                //    readOnly = readOnlyi.next();
                //}
                var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
                tempObject[tcol.getColumnName()] = fieldInfo;
            }

            tempArray.push(tempObject);  // end of record
        }
        return tempArray;
    }
    return tempArray;
}


