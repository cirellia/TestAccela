function getMinNonCompletedMax() {
        //checks to see if an upcomming min=max, if not, it calls getMinApprovedMin() again
        var min = null,
            max = null,
            nextLowestMax = 9999999;

        for (var x in inspectionOrderTable) {
            min = max = null;
            if (inspectionOrderTable[x]["Current Status"] != "Complete") {
                min = inspectionOrderTable[x]["Min"];
                max = inspectionOrderTable[x]["Max"];
            }
            if (min & max && parseInt(min) == minNonCompletedMin) {
                if (parseInt(max) < nextLowestMax) {
                    nextLowestMax = parseInt(max);
                }
            }
        }
        return nextLowestMax;
    }

