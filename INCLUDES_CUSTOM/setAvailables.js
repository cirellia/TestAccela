function setAvailables() {
        var min = null,
            max = null;

        for (var x in inspectionOrderTable) {
            min = max = null;

            if (inspectionOrderTable[x]["Current Status"] != "Complete") {
                aa.print(inspectionOrderTable[x]["Inspection Type"] + ' is not complete');
                min = inspectionOrderTable[x]["Min"];
                max = inspectionOrderTable[x]["Max"];
            }
            if (min && parseInt(min) <= minNonCompletedMin) {
                aa.print('setting ' + inspectionOrderTable[x]["Inspection Type"] + ' to avail');
                inspectionOrderTable[x]["Current Status"] = 'Available';
            }
        }
    }

