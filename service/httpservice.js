const request = require('request');
// const config = require('../misc/config');
//
//
// const oauth2TokenTest = "eyJhbGciOiJIUzUxMiIsInppcCI6IkRFRiJ9.eNo8jDsOgzAQRO-yNUL-gK1slzJN7mC8Llw4IC-WiaLcnaWhG72ZeT8IjQChpwUG4LZINg8vuYT4JKqJWZDWaAxai9OE84zOyoDWEvLnHUq6_r2P4tjCd4xrkbZxqi-6bZR5rznuFzJ2gHRsID7ltfPWKfU_AQAA__8.7DY9LPOyqNXYJlIzFy7-xEeMQcAuFeTZc826AAhYt4Ehqz8JKsJEeh8P2Fqte4qBCzEfp4eyIn_9g86x7_SvOg";
// const oauth2Token = "eyJhbGciOiJIUzUxMiIsInppcCI6IkRFRiJ9.eNo8jMsKwjAQAP9lz6WkTW1kb7YoePEf0t0FA01T8kBF_HfjxdswDPMGWxgQHrJAA6kslXWvKntLJ-YoKVV1nvEy4DThbFAfsDvWgIO3brtZLzUgm-4U1lUou7C1_iXC1FLwNSxJ4pX_Y3YpR0f5p_qhAXnugFor041Gj0p9vgAAAP__.jmC3DEn266mzWqzHWjKCRQZcXpruvrXGe5M4eAYVCWdOmaqxGANXi3m3fpprpx9VzmPX_1gPjFKKCerGzmrzfA";
//
// const testEedcBaseUrl = "https://dev.myeedc.com/cashcollection/business/api/";
// const liveEedcBaseUrl = "https://cashcollection.myeedc.com/business/api/";
// const testOrigin = "www.webpay.com";
// const liveOrigin = "cashcollection.myeedc.com";
//
// const eedcHeader = {
//     Accept: 'application/json',
//     Origin: (config.appMode=="development"?testOrigin:liveOrigin),
//     Authorization: 'Bearer ' + (config.appMode=="development"?oauth2TokenTest:oauth2Token)
// }


var log4js = require('log4js');
var logger = log4js.getLogger();

class HttpService {

    // getEedcBaseUrl(){
    //     return config.appMode=="development"?testEedcBaseUrl:liveEedcBaseUrl;
    // }
    //
    // sendEedcRequest(url, requestMethod, requestData, callback) {
    //     var options;
    //     if (requestMethod.toUpperCase() === 'GET') {
    //         options = {
    //             url: this.getEedcBaseUrl() + url,
    //             headers: eedcHeader,
    //             json:true,
    //             qs:requestData
    //         };
    //     } else {
    //         options = {
    //             method: 'POST',
    //             url: this.getEedcBaseUrl() + url,
    //             headers:eedcHeader,
    //             json:true,
    //             body:requestData
    //         };
    //         //JSON.stringify(requestData)
    //     }
    //     request(options, function (error, response, body) {
    //         if(error){
    //             logger.error(error);
    //         }
    //         callback(body);
    //     } );
    // };


    //"username=YourUsername&password=YourPassword&sender=SenderID&recipient=234809xxxxxxx,2348030000000&message=YourMessage
    sendSMSToCustomer(requestMethod,requestData,callback){
        var options;
        if (requestMethod.toUpperCase() === 'GET') {
            options = {
                url: "http://api.smartsmssolutions.com/smsapi.php",
                headers: {},
                json:true,
                qs:requestData
            };
        } else {
            options = {
                method: 'POST',
                url: "http://api.smartsmssolutions.com/smsapi.php",
                headers:{},
                json:true,
                body:requestData
            };
            //JSON.stringify(requestData)
        }
        request(options, function (error, response, body) {
            if(error){
                console.log("Send SMS ERROR",error);
                callback(error);
            }
            callback(body);
        } );
    }
}


module.exports = new HttpService();