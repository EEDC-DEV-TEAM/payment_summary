var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb').MongoClient);
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var assert = require('assert');
var moment = require('moment');
var smsservice = require('../service/sendsummary');

/* GET home page. */
router.get('/daysummary', function(req, res, next) {

    const url = 'mongodb://localhost:27017';
    const dbName = 'cashcollectiondb';
    let queryResult =[];
    let monthArray =[];
    let apiResponse =[];
    let zoneSummary={};
    let grandtotal=0;
    (async function() {
        const client = new MongoClient(url);
        try {
            await client.connect();
            console.log("Connected correctly to server");

            const db = client.db(dbName);

            // Get the collection
            const col = db.collection('transaction');

            // Insert multiple documents
            //const r = await col.insertMany([{a:1}, {a:1}, {a:1}]);
            //assert.equal(3, r.insertedCount);

            // Get the cursor
            const cursor = col.aggregate({$match:{customerDistrict:{$exists: true},status:"Successful","transactionDate":{$gte: new Date(new Date().setHours(00,00,00)),
                $lt: new Date(new Date().setHours(23,59,59))}}},
                {$project: {'paymentPlan': 1,'amount':1,'customerDistrict': {$let: {vars: {refParts: {$objectToArray: '$$ROOT.customerDistrict'}}, in: '$$refParts.v'}}}},
                {$lookup:{from:'district',localField:'customerDistrict',foreignField:'_id',as:'bu'}},
                {$unwind:'$bu'},
                {$group: {_id: {district: "$bu.name", plan: "$paymentPlan"},
                count:{$sum:1},total:{$sum: "$amount"}}},{$group:{_id:"$_id.district",transactions:{$push:{plan: "$_id.plan",count: "$count",
                total: "$total"}},daytotal: {$sum: "$total"}}},{$sort:{_id: 1}});

            //{$project: {'paymentPlan': 1,'amount':1}}, Iterate over the cursor {$group:{_id:null,daytotal: {$sum: "$total"}}} //,daytotal:{$sum: {$sum: "$amount"}}
            while(await cursor.hasNext()) {
                const doc = await cursor.next();
                //console.log("Result>> ",doc);
                queryResult.push(doc);
            }

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 2);
            //var day = firstDay.setHours(28,59,59);
            //console.log("Date>>",firstDay);
            var monthStart = moment().startOf('month').toISOString(true);
            monthStart=monthStart.split("+")[0]+"Z"
            monthStart = new Date(monthStart);

            console.log("Moment>>",monthStart);

            const cursor2 = col.aggregate({$match:{customerDistrict:{$exists: true},"status": "Successful",transactionDate:{$gte: monthStart}}},
                {$project: {'amount':1,'customerDistrict': {$let: {vars: {refParts: {$objectToArray: '$$ROOT.customerDistrict'}}, in: '$$refParts.v'}}}},
                {$lookup:{from:'district',localField:'customerDistrict',foreignField:'_id',as:'bu'}},
                {$unwind:'$bu'},
                {$group: {_id: "$bu.name",count:{$sum:1},total:{$sum: "$amount"}}},
                {$sort:{_id: 1}});


            while(await cursor2.hasNext()) {
                const doc = await cursor2.next();
                //console.log("Result>> ",doc);
                monthArray.push(doc);
            }

            const cursor3 = col.aggregate({$match:{status:"Successful","transactionDate":{$gte: new Date(new Date().setHours(00,00,00)),
                    $lt: new Date(new Date().setHours(23,59,59))}}},
                {$group: {_id:{plan: "$paymentPlan",status:"$status"},count:{$sum:1},total:{$sum: "$amount"}}},
                {$group:{_id:"$_id.status",transactions:{$push:{plan:"$_id.plan",count: "$count",
                    total: "$total"}},daytotal: {$sum: "$total"}}}
                ,{$sort:{_id: 1}});

            while(await cursor3.hasNext()) {
                const doc = await cursor3.next();
                zoneSummary = {district: "Zone",transactions: doc.transactions,daytotal:doc.daytotal};
            }

            // const cursor4 = col.aggregate({$match:{"status": "Successful",transactionDate:{$gte: monthStart}}},
            //     {$group: {_id: "$status",mtd:{$sum: "$amount"}}});
            //
            // while(await cursor4.hasNext()) {
            //     const docs = await cursor4.next();
            //     //console.log("Doc>>>",doc);
            //     //grandtotal.push(docs);
            // }

            for(var i=0;i<monthArray.length;i++){
                for(var j =0;j<queryResult.length;j++){
                    if(monthArray[i]._id===queryResult[j]._id){
                        var result = {district:queryResult[j]._id,
                        transactions: queryResult[j].transactions,daytotal:queryResult[j].daytotal,mtd:monthArray[i].total};
                        apiResponse.push(result);
                    }
                }
                grandtotal += monthArray[i].total;
            }
            zoneSummary.mtd = grandtotal;
            apiResponse.push(zoneSummary);

            //console.log("Zone Summary>>",zoneSummary);
            //console.log("Summarry>>",apiResponse);
            //{day: queryResult,month:monthArray}
            smsservice.sendMessage(apiResponse);

            res.send({Message: "Messages Sent successfully"});
        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
});

module.exports = router;