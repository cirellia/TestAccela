var skipFeeCheck = false;

if(appMatch("Licenses/Business/Tax Receipt/Application") &&
   AInfo["Business Type of Organization"] == '501c3 Not for Profit' &&
   (AInfo['Total Fire Fees'] == null || AInfo['Total Fire Fees'] == 0 || AInfo['Total Fire Fees'] == undefined || AInfo['Total Fire Fees'] == "")){
	skipFeeCheck = true;
}



var feeArr = loadFees();
var feeInvoiced = false;
var amount = 0;
var amountPaid = 0;
for (fee in feeArr)
{
  if (feeArr[fee].status == "INVOICED")
  {
    amount += feeArr[fee].amount;
    amountPaid += feeArr[fee].amountPaid;
    feeInvoiced = true;
  }
}
var balance = amount - amountPaid;

if(skipFeeCheck){
	;
}
else{
    if ( ( ! feeInvoiced || balance) && matches(wfTask,"Receipt Issuance","Review") && matches(wfStatus,"Issued","Renewed","Change Approved"))
    {
        showMessage=true;
        if ( ! feeInvoiced)
        {
            comment("There are no Fees invoiced on this record.  You must have at least 1 fee invoiced to proceed.");
        }
        else if (balance)
        {
            comment("The invoiced Fees on this record have an outstanding balance of $"+balance);
        }
        cancel = true;
    }
}
