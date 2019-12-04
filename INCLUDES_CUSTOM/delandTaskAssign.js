function delandTaskAssign(vTask, assignToUser) {
    if (assignToUser.indexOf("/") > -1) {
        //value contains a / is is a department
        updateTaskDepartment(vTask, assignToUser);
    }
    else {
        //value is a user id
        assignTask(vTask, assignToUser);
    }

    logDebug(vTask + " task has been assigned to " + assignToUser);
}
