
var httpservice = require('./httpservice');
var moment = require('moment');


let phonenumbers = ["08067759749","08150824215","08150824000","08150825264"];
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


class  sendsummary {
    sendMessage(summary){
        //console.log("Payload>>",summary);
        //requestMethod,requestData,callback OK 1

        const message = summary.district+" collections as at:\n"+moment().format('DD-MM-YYYY, h:mm:ss a') +"\n----\n"+
        summary.transactions[0].plan.toUpperCase() +"\n"+ "Payments: "+ summary.transactions[0].count+"\n"+
        "Total: N"+numberWithCommas(summary.transactions[0].total) +"\n----\n"+
        summary.transactions[1].plan.toUpperCase() +"\n"+ "Payments: "+ summary.transactions[1].count+"\n"+
        "Total: N"+numberWithCommas(summary.transactions[1].total)+"\n----\n"+
        "Day Cumulative: N"+numberWithCommas(summary.daytotal)+"\n----\n"+
        "MTD: N"+numberWithCommas(summary.mtd);



        let requestData={
            username: "Eedc Enugu",
            password:"eedc@enugudisco",
            sender:"EEDC",
            //recipient: number,
            message: message
        };
        console.log(requestData);

        for(var i=0;i<phonenumbers.length;i++){
            requestData.recipient=phonenumbers[i];
            httpservice.sendSMSToCustomer("GET",requestData,function (response) {
                console.log(phonenumbers[i]+" SMS Api Response",response);
            })
        }
    }
}

module.exports = new sendsummary();
