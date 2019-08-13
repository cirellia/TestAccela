//To deactivate the other parallel tasks when Follow Up is initially activated
if (wfTask == "Initial Investigation" && matches(wfStatus, "Prelim NOV", "NOV", "In Violation")) {
    deactivateTask("Magistrate");
    deactivateTask("Lien");
    deactivateTask("Abatement");
}
if (wfTask == "Follow Up" && matches(wfStatus, "First Magistrate Hearing Scheduled")) {
    if (!isTaskActive("Lien"));
    deactivateTask("Lien");
    if (!isTaskActive("Abatement"));
    deactivateTask("Abatement");
}
if (wfTask == "Follow Up" && matches(wfStatus, "Abatement")) {
    if (!isTaskActive("Lien"));
    deactivateTask("Lien");
    if (!isTaskActive("Magistrate"));
    deactivateTask("Magistrate");
}