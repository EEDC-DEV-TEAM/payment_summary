
var log4js = require('log4js');
var logger = log4js.getLogger();
var mailer = require('express-mailer');

class MailService {
   sendMailRequest(recipient,template,data, res) {
       res.mailer.send(template, {
           to: recipient,
           subject: 'Hourly Payment Summary',
           payment: data
       }, function (err) {
           if (err) {
               // handle error
               console.log(err);
                return;
           }
       });

    };

}


module.exports = new MailService();