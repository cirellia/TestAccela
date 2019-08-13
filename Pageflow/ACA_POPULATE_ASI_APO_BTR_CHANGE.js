/*------------------------------------------------------------------------------------------------------/
| Program       : ACA_POPULATE_ASI_APO_BTR_CHANGE.js
| Event         : Page Flow script
| Created by    : Chris Bodolus
| Created at    : 20190215
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
 | START User Configurable Parameters
 |
 |     Only variables in the following section may be changed.  If any other section is modified, this
 |     will no longer be considered a "Master" script and will not be supported in future releases.  If
 |     changes are made, please add notes above.
 /------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var showDebug = false; // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false; // Use Group name when populating App
// Specific Info Values
var useTaskSpecificGroupName = false; // Use Group name when populating Task
// Specific Info Values
var cancel = false;
/*------------------------------------------------------------------------------------------------------/
 | END User Configurable Parameters 
 /------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
    useSA = true;
    SA = bzr.getOutput().getDescription();
    bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
    if (bzr.getSuccess()) {
        SAScript = bzr.getOutput().getDescription();
    }
}

if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
    eval(getScriptText(SAScript, SA));
} else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
}

//eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName) {
    var servProvCode = aa.getServiceProviderCode();
    if (arguments.length > 1)
        servProvCode = arguments[1]; // use different serv prov code
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}

var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
appTypeResult = cap.getCapType();
appTypeAlias = appTypeResult.getAlias();
appTypeString = appTypeResult.toString();
appTypeArray = appTypeString.split("/");
var parentCapId = cap.getParentCapID();
var parentCap = aa.cap.getCapViewBySingle4ACA(parentCapId);
var parAInfo = [];
/*------------------------------------------------------------------------------------------------------/
 | Start ACA_POPULATE_ASI_APO
 /-----------------------------------------------------------------------------------------------------*/
var capModelInitiated = aa.env.getValue("CAP_MODEL_INITIATED");
try {
    if (capModelInitiated != "TRUE")
    {
        var olduseAppSpecificGroupName = useAppSpecificGroupName;
        useAppSpecificGroupName = true;
        var copyAPOData = true;  //Always copy APO data.
        logDebug("ParentCapId: " + parentCapId);
        logDebug("ParentCap: " + parentCap);
        if (parentCap != null) {
            //set APO to false if application matches
            if(appMatch("Licenses/Business/Tax Receipt/Change")){
                copyAPOData = false;
				
				
                //Copy ASIT
                var tableInformation = new Array();
                var tableName = "BTR PROFESSIONAL";
                tableInformation = loadASITable(tableName, parentCapId);
                if (tableInformation && tableInformation.length > 0) 
                {
                  addASITable4ACAPageFlowXX(cap.getAppSpecificTableGroupModel(), tableName, tableInformation);
                }
            }
            
            logDebug("Copying the ASI...");
            copyAppSpecific4ACA(parentCap);
            //Load Number of employees.  NOTE: it's different in BTR than in BTR Change.
            loadAppSpecific4ACA(parAInfo, parentCapId);
            
            editAppSpecific4ACA("CHANGE INFORMATION.Total Number of Employees", parAInfo["BUSINESS INFORMATION.Number of Employees"]);
            
            logDebug("Finished copying ASI");
            logDebug("");
            printMethodsWithValues(cap);
            printMethodsWithValues(parentCap);
            if(copyAPOData){
                logDebug("Copying the Address...");
                cap.setRefAddressModel(parentCap.getRefAddressModel());
                cap.setAddressModel(parentCap.getAddressModel());
                //copyAddresses(parentCapId,capId);
                logDebug("");
                logDebug("Copying the Parcel...");
                cap.setCapOwnerModel(parentCap.getCapOwnerModel());
                cap.setOwnerModel(parentCap.getOwnerModel());
                //copyParcels(parentCapId,capId);
                logDebug("");
                logDebug("Copying the Owner...");
                cap.setCapParcelModel(parentCap.getCapParcelModel());
                cap.setParcelModel(parentCap.getParcelModel());
            }
            //copyOwner(parentCapId,capId);
            logDebug("");
            logDebug("Copying the Detail...");
            //copyCap Detail - MAG
            cap.setSpecialText(parentCap.getSpecialText());
            //          
            //copy contacts
            logDebug("");
            logDebug("Copying Contact Models");
            
            
            logDebug("");
            aa.env.setValue("CapModel",cap);
            aa.env.setValue("CAP_MODEL_INITIATED", "TRUE");
            
            
        }
    }
    
    useAppSpecificGroupName = olduseAppSpecificGroupName;

    if (parentCap)
{
  var cap = aa.env.getValue("CapModel");
  contactList = parentCap.getContactsGroup();
  contactListDB = aa.people.getCapContactByCapID(parentCapId).getOutput();
  for (var vCounter1 = 0; vCounter1 < contactList.size(); vCounter1++)
  {
    var vContSeq = contactList.get(vCounter1).getPeople().getContactSeqNumber();
  var vContPeople = contactList.get(vCounter1).getPeople();
    for (var vCounter2 in contactListDB)
    {
      var vContDB = contactListDB[vCounter2].getCapContactModel();
      if (vContDB.getPeople().getContactSeqNumber() == vContSeq)
      {
        var DbTemplate = vContDB.getTemplate();
        //Fix for PRD defect 4747 
        //When there is no ASI subGroup associated with the contact type associated with record at that it will get template as a null as a result it will give DbTemplate value as a null so it will throw null pointer exception in scrubTemplate when it will set entityPKModel
        if(DbTemplate != null)
        {
          logDebug("Template Found.");
          DbTemplate = scrubTemplate(DbTemplate); 
        }
    
    var proxyBus = aa.proxyInvoker.newInstance("com.accela.aa.template.GenericTemplateBusiness").getOutput();
    proxyBus.setInstructionAndWaterMark2TemplateFields('DELAND',DbTemplate);
    
        contactList.get(vCounter1).setTemplate(DbTemplate);
  
        var vCType = contactList.get(vCounter1).getContactType();
        if (vCType == "Business Owner"){
          contactList.get(vCounter1).setComponentName("Contact1");
        }else if (vCType == "Emergency Contact"){
          contactList.get(vCounter1).setComponentName("Contact2");
        }else if (vCType == "Building Owner"){
          contactList.get(vCounter1).setComponentName("Contact3");        
        }else {
          contactList.get(vCounter1).setComponentName("Contact List");            
        }
      }
    }
  }
  if (cap.getContactsGroup() == null || cap.getContactsGroup().toArray().length == 0)
  {
    contactList = scrubContactListSequenceNumbers(contactList);
    cap.setContactsGroup(contactList);
  }

  
  
  pContacts = aa.people.getCapContactByCapID(parentCapId).getOutput();
  for (par in pContacts)
  {
    var vContDB = pContacts[par].getCapContactModel();
    var addressList = aa.address.getContactAddressListByCapContact(vContDB).getOutput();
    for (ad in addressList)
    {
      var oldAddID = addressList[ad].getAddressID();
      var returnModel = aa.address.createContactAddress(addressList[ad].getContactAddressModel());
      var fvXRef = aa.address.createXRefContactAddressModel().getOutput();
      //fvXRef.setEntityID(parseInt(vContDB.getContactSeqNumber()));
      fvXRef.setAddressID(oldAddID);
          
      var xrefList = aa.address.getXRefContactAddressList(fvXRef.getXRefContactAddressModel()).getOutput();
      for (rAdd in xrefList)
      {
        if(xrefList[rAdd])
        {         
          if(xrefList[rAdd].getCapID().toString() != capId.toString())
          {
            var fvXRefContactAddress = xrefList[rAdd];
            aa.address.deleteXRefContactAddress(fvXRefContactAddress.getXRefContactAddressModel());
            var newXRef = aa.address.createXRefContactAddressModel().getOutput();
            newXRef.setEntityID(xrefList[rAdd].getEntityID());
            newXRef.setEntityType(xrefList[rAdd].getEntityType());
            newXRef.setCapID(xrefList[rAdd].getCapID());
            newXRef.setAddressID(returnModel.getOutput().getAddressID());
            aa.address.createXRefContactAddress(newXRef.getXRefContactAddressModel());
          }
        }
      }
    }
  }
}
} catch (ex) {
    aa.env.setValue("ErrorCode", "-1");
    aa.env.setValue("ErrorMessage", ex.message);
}


if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
} else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage)
            aa.env.setValue("ErrorMessage", message);
        if (showDebug)
            aa.env.setValue("ErrorMessage", debug);
    } else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage)
            aa.env.setValue("ErrorMessage", message);
        if (showDebug)
            aa.env.setValue("ErrorMessage", debug);
    }
}

/*------------------------------------------------------------------------------------------------------/
 | End ACA_POPULATE_MODIFICATION_NAME
 /-----------------------------------------------------------------------------------------------------*/
 //aa.sendEmail("DoNotReply@DeLand.gov", "mag@byrnesoftware.com", "", "ACA Modification - OnLoad", "Message: " + message + " Debug: " + debug, null);

 function scrubContactListSequenceNumbers(contactList)
{
    //var newList = contactList;

  //var capContactModelList = contactList.toArray();

  for(var i = 0; i < contactList.length; i++)
  {
    var capContactModel = contactList[i];
    var pModel = capContactModel.getPeople();
if(pModel.contactType == "Business")
{
    // Remove contact seq number, this is only for parent cap. Fix issue #1.
    capContactModel.setContactSeqNumber(null);
    pModel.setContactSeqNumber(null);
    // Update the Label Information for Contact Attributes
    pModel.setAttributes(updateContactAttributeFieldLabel(pModel.getContactType(),pModel.getAttributes()));
  }
}
  return contactList;
}

 function printMethodsWithValues(object)
{
    for (x in object.getClass().getMethods())
    {
        var method = object.getClass().getMethods()[x];
        var methodName = method.getName();
        //if (methodName.indexOf("get") == 0)
          logDebug(methodName  + ": " + propertyValueFromName(object, methodName));
    }
}


function propertyValueFromName(object, methodName)
{
    var lengthValue = (methodName + "").length;
    if (methodName.indexOf("get") == 0 && lengthValue > 3) 
    {
        var propertyName = methodName.substr(3, 1).toLowerCase() + methodName.substr(4);
        return object[propertyName];
    } 
    else 
    {
        return "";
    }
}

function addASITable4ACAPageFlowXX(destinationTableGroupModel, tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    // 

    var itemCap = capId
    if (arguments.length > 3)
        itemCap = arguments[3]; // use cap ID specified in args

    var ta = destinationTableGroupModel.getTablesMap().values();
    var tai = ta.iterator();

    var found = false;

    while (tai.hasNext()) { 
        var tsm = tai.next();  // com.accela.aa.aamain.appspectable.AppSpecificTableModel
        if (tsm.getTableName().equals(tableName)) { found = true; break; }
    }


    if (!found) { logDebug("cannot update asit for ACA, no matching table name"); return false; }

    var fld = aa.util.newArrayList();  // had to do this since it was coming up null.
    var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
    var i = -1; // row index counter

    for (thisrow in tableValueArray) {


        var col = tsm.getColumns()
        var coli = col.iterator();

        while (coli.hasNext()) {
            var colname = coli.next();

            if (typeof (tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue, colname);        
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
        if(fldToAdd)
        {
          fldToAdd.setRowIndex(i);
                  fldToAdd.setFieldLabel(colname.getColumnName());
                  fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
                  fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
                  fld.add(fldToAdd);
                  fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
        }
                
            }
            else // we are passed a string
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()], colname);
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
                if(fldToAdd)
        {
          fldToAdd.setRowIndex(i);
                  fldToAdd.setFieldLabel(colname.getColumnName());
                  fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
                  fldToAdd.setReadOnly(false);
                  fld.add(fldToAdd);
                  fld_readonly.add("N");
               }
            }
        }

        i--;

        tsm.setTableFields(fld);
        tsm.setReadonlyField(fld_readonly); // set readonly field
    }


    tssm = tsm;

    return destinationTableGroupModel;

}