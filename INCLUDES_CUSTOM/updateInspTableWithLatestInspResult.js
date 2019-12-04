function updateInspTableWithLatestInspResult() {
        for (var x in inspectionOrderTable) {
            if (inspType.toUpperCase().equals(inspectionOrderTable[x]["Inspection Type"].toString().toUpperCase()) && inspectionOrderTable[x]["Current Status"] == "Available") {
                inspectionOrderTable[x]["Approved Date"] = inspResultDate;
                inspectionOrderTable[x]["Current Status"] = "Complete";
            }
        }
    }

