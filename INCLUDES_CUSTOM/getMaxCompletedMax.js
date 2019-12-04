function getMaxCompletedMax() {
        var min = null,
            max = null,
            biggestMinCompletedMax = 0;

        for (var x in inspectionOrderTable) {
            min = max = null;
            if (inspectionOrderTable[x]["Current Status"] == "Complete") {
                max = inspectionOrderTable[x]["Max"];
                if (max && parseInt(max) > biggestMinCompletedMax) {
                    biggestMinCompletedMax = parseInt(inspectionOrderTable[x]["Max"]);
                }
            }
        }
        return biggestMinCompletedMax;
    }

