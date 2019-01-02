
var httpservice = require('./httpservice');
var moment = require('moment');
var contacts = require('../contacts.json');


//let phonenumbers = ["08067759749","08150824215","08150824000","08150825264"];
function numberWithCommas(x) {
    x = x.toString().split(".")[0];
    return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


class  sendsummary {
    sendMessage(summary){
        //console.log("Payload>>",summary);
        //requestMethod,requestData,callback OK 1

        let requestData={
            username: "Eedc Enugu",
            password:"eedc@enugudisco",
            sender:"EEDC",
            //recipient: number,
            //message: message
        };
        //console.log(requestData);

        for(var i=0;i<contacts.length;i++){
            for(var j=0;j<summary.length;j++){
                if(contacts[i].district===summary[j].district){
                    var message;
                    if(summary[j].transactions.length>1){
                        message = summary[j].district+" collections as at:\n"+moment().format('DD/MM/YYYY h:mm a') +"\n----\n"+
                            summary[j].transactions[0].plan.toUpperCase() +"\n"+ "Payments: "+ summary[j].transactions[0].count+"\n"+
                            "Total: N"+numberWithCommas(summary[j].transactions[0].total) +"\n----\n"+
                            summary[j].transactions[1].plan.toUpperCase() +"\n"+ "Payments: "+ summary[j].transactions[1].count+"\n"+
                            "Total: N"+numberWithCommas(summary[j].transactions[1].total)+"\n----\n"+
                            "Day Cumulative: N"+numberWithCommas(summary[j].daytotal)+"\n----\n"+
                            "MTD: N"+numberWithCommas(summary[j].mtd);
                    }
                    else{
                        message = summary[j].district+" collections as at:\n"+moment().format('DD/MM/YYYY h:mm a') +"\n----\n"+
                            summary[j].transactions[0].plan.toUpperCase() +"\n"+ "Payments: "+ summary[j].transactions[0].count+"\n"+
                            "Total: N"+numberWithCommas(summary[j].transactions[0].total) +"\n----\n"+
                            // summary[j].transactions[1].plan.toUpperCase() +"\n"+ "Payments: "+ summary[j].transactions[1].count+"\n"+
                            // "Total: N"+numberWithCommas(summary[j].transactions[1].total)+"\n----\n"+
                            "Day Cumulative: N"+numberWithCommas(summary[j].daytotal)+"\n----\n"+
                            "MTD: N"+numberWithCommas(summary[j].mtd);
                    }
                    requestData.message = message;
                    requestData.recipient=contacts[i].phoneNumber;
                    console.log("Name: ",contacts[i].name+"\n"+message);
                }
            }

            // httpservice.sendSMSToCustomer("GET",requestData,function (response) {
            //     console.log(phonenumbers[i]+" SMS Api Response",response);
            // })
        }

        //console.log("Contacts",contacts[0]);
    }
}

module.exports = new sendsummary();
