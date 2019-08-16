try{
//Script Fill in Violation field based on Drill Down selection
	var description = null;
	var ENFORCEMENT = loadASITable("VIOLATIONS");
	if (typeof(ENFORCEMENT) == "object")
	{
		aa.print("Found Violation table");
		removeASITable("VIOLATIONS");
		for (y in ENFORCEMENT)
		{
			if (ENFORCEMENT[y]["Violation Description"] == "null" || ENFORCEMENT[y]["Violation Description"] == null || ENFORCEMENT[y]["Violation Description"] == "")
			{
				description = lookup("CE_ViolationDescription",ENFORCEMENT[y]["Violation"]);
				ENFORCEMENT[y]["Violation Description"]  = description;
				aa.print("Setting Violation Description to: " + description);
			}
		}
		addASITable("VIOLATIONS",ENFORCEMENT);
	}
}
catch (err) {
	
	logDebug("A JavaScript Error occurred: ASIUA;Enforcement/*/* " + err.message);
}