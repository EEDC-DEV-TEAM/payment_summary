var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var MongoClient = Promise.promisifyAll(require('mongodb').MongoClient);
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var assert = require('assert');
var moment = require('moment');
var smsservice = require('../service/sendsummary');
var mailService = require('../service/mailService');

/* GET home page. mongodb://admin:password@localhost:27017/db*/
router.get('/daysummary', function(req, res, next) {
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
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
            //client.
            console.log("Connected correctly to server");
            const db = client.db(dbName);
            const col = db.collection('transaction');
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

            smsservice.sendMessage(apiResponse);

            res.send({Message: "Messages Sent successfully"});
        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
})


router.get('/monthsummary',function(req,res,next){
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
    const dbName = 'cashcollectiondb';

    (async function() {
        const client = new MongoClient(url);
        try {
            await client.connect();
            console.log("Connected correctly to server");
            const db = client.db(dbName);
            const col = db.collection('transaction');
            var monthStart = moment().startOf('month').toISOString(true);
            monthStart=monthStart.split("+")[0]+"Z"
            monthStart = new Date(monthStart);

            var monthArray=[];

            // col.aggregate({$match:{customerDistrict:{$exists: true},"status": "Successful",transactionDate:{$gte: monthStart}}},
            //    {$project: {'amount':1,'customerDistrict': {$let: {vars: {refParts: {$objectToArray: '$$ROOT.customerDistrict'}}, in: '$$refParts.v'}}}},
            //    {$lookup:{from:'district',localField:'customerDistrict',foreignField:'_id',as:'bu'}},
            //    {$unwind:'$bu'},
            //    {$group: {_id: "$bu.name",count:{$sum:1},mtd:{$sum: "$amount"}}},
            //    {$sort:{_id: 1}});

            const cursor2 = col.aggregate({$match:{customerDistrict:{$exists: true},"status": "Successful",transactionDate:{$gte: monthStart}}},
                {$project: {'amount':1,'districtString':1}},
                {$group: {_id: "$districtString",count:{$sum:1},mtd:{$sum: "$amount"}}},
                {$sort:{_id: 1}});


            var distArr=[];

            //console.log("cursor.next>>>",cursor2.hasNext());
            //const doc_cursor =);
            while(await cursor2.hasNext()) {
                const doc = await cursor2.next();
                monthArray.push(doc);
                distArr.push(doc._id);
            }
            //console.log("MonthArray>>>",monthArray);

            var districts=['Aba','Abakaliki','Ariaria','Awka','Awkunanaw','Ogui','Nsukka','Nnewi',
                'Abakpa','Ogidi','Ogbaru','Onitsha','Ekwulobia','Orlu','Mbaise','Owerri','New Owerri','Umuahia'];

            //console.log("18 districts>>>",districts);

            //console.log("database districts>>>",distArr);
           // const tempMonthArray =
            districts.map((item,index)=> {
                if(!distArr.includes((districts[index]))){
                    monthArray.push({_id:districts[index],count:0,mtd:0});
                }
            })

            //console.log("MonthArray after loop>>>",monthArray.length);

            res.send(monthArray);

        }catch (err){
            console.log(err.stack);
        }
        client.close();
    })()
})

function getDistricts() {
    return ["Aba","Abakaliki","Ariaria","Awka","Awkunanaw","Ogui","Nsukka","Nnewi",
        "Abakpa","Ogidi","Ogbaru","Onitsha","Ekwulobia","Orlu","Mbaise","Owerri","New Owerri","Umuahia"]
}

router.get('/totalcollection', function(req, res, next) {
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
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
            const col = db.collection('transaction');
            var dayStart = moment().startOf('day').toISOString(true);//.subtract("day",1) new Date(new Date().setHours(00,00,00))$lt: new Date(new Date().setHours(23,59,59))
            console.log("DayStart>>>",dayStart);
            const cursor = col.aggregate({$match:{customerDistrict:{$exists: true},status:"Successful","transactionDate":{$gte: new Date(dayStart)}}},
                {$project: {'paymentPlan': 1,'amount':1,'customerDistrict': {$let: {vars: {refParts: {$objectToArray: '$$ROOT.customerDistrict'}}, in: '$$refParts.v'}}}},
                {$lookup:{from:'district',localField:'customerDistrict',foreignField:'_id',as:'bu'}},
                {$unwind:'$bu'},
                {$group: {_id: {district: "$bu.name", plan: "$paymentPlan"},
                    count:{$sum:1},total:{$sum: "$amount"}}},{$group:{_id:"$_id.district",transactions:{$push:{plan: "$_id.plan",count: "$count",
                    total: "$total"}},daytotal: {$sum: "$total"}}},{$sort:{_id: 1}});

            //{$project: {'paymentPlan': 1,'amount':1}}, Iterate over the cursor {$group:{_id:null,daytotal: {$sum: "$total"}}} //,daytotal:{$sum: {$sum: "$amount"}}

            while(await cursor.hasNext()) {
                const doc = await cursor.next();
                queryResult.push(doc);
            }
            console.log("DaySummary>>>>",queryResult);

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 2);
            //var day = firstDay.setHours(28,59,59);
            //console.log("Date>>",firstDay);
            var monthStart = moment().startOf('month').toISOString(true);
            monthStart=monthStart.split("+")[0]+"Z"
            monthStart = new Date(monthStart);

            //.log("Moment>>",monthStart);

            const cursor2 = col.aggregate({$match:{customerDistrict:{$exists: true},"status": "Successful",transactionDate:{$gte: monthStart}}},
                {$project: {'amount':1,'customerDistrict': {$let: {vars: {refParts: {$objectToArray: '$$ROOT.customerDistrict'}}, in: '$$refParts.v'}}}},
                {$lookup:{from:'district',localField:'customerDistrict',foreignField:'_id',as:'bu'}},
                {$unwind:'$bu'},
                {$group: {_id: "$bu.name",count:{$sum:1},total:{$sum: "$amount"}}},
                {$sort:{_id: 1}});


            while(await cursor2.hasNext()) {
                const doc = await cursor2.next();
                monthArray.push(doc);
            }

            // const cursor3 = col.aggregate({$match:{status:"Successful","transactionDate":{$gte: new Date(new Date().setHours(00,00,00)),
            //         $lt: new Date(new Date().setHours(23,59,59))}}},
            //     {$group: {_id:{plan: "$paymentPlan",status:"$status"},count:{$sum:1},total:{$sum: "$amount"}}},
            //     {$group:{_id:"$_id.status",transactions:{$push:{plan:"$_id.plan",count: "$count",
            //         total: "$total"}},daytotal: {$sum: "$total"}}}
            //     ,{$sort:{_id: 1}});
            //
            // while(await cursor3.hasNext()) {
            //     const doc = await cursor3.next();
            //     zoneSummary = {district: "Zone",transactions: doc.transactions,daytotal:doc.daytotal};
            // }
            //

            console.log("monthArray>>>>",monthArray);
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

            //zoneSummary.mtd = grandtotal;
            //apiResponse.push(zoneSummary);

            //smsservice.sendMessage(apiResponse);

            console.log("Api Response>>>>",apiResponse);

            res.send(apiResponse);
        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
})

router.get('/collections', function(req, res, next) {
    const district = req.query.district;

    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
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
            const col = db.collection('transaction');
            var dayStart = moment().startOf('day').toISOString(true);
            console.log("DayStart>>>",dayStart);

            const cursor = col.aggregate({$match:{customerDistrict:{$exists: true}, districtString:district.trim(), status:"Successful","transactionDate":{$gte: new Date(dayStart)}}},
                {$project: {'paymentPlan': 1,'amount':1,'districtString':1}},
                {$group: {_id: {district: "$districtString", plan: "$paymentPlan"},
                    count:{$sum:1},total:{$sum: "$amount"}}},{$group:{_id:"$_id.district",transactions:{$push:{plan: "$_id.plan",count: "$count",
                    total: "$total"}},daytotal: {$sum: "$total"}}},{$sort:{_id: 1}});


            if(await cursor.hasNext()) {
                const doc = await cursor.next();
                queryResult.push(doc);
            }else{
                queryResult.push({transactions:[{
                    "plan": "Postpaid",
                    "count": 0,
                    "total": 0
                },
                    {
                        "plan": "Prepaid",
                        "count": 0,
                        "total": 0
                    }],daytotal:0})
            }
            //console.log("DaySummary>>>>",queryResult);

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 2);
            var monthStart = moment().startOf('month').toISOString(true);
            monthStart=monthStart.split("+")[0]+"Z"
            monthStart = new Date(monthStart);

            const cursor2 = col.aggregate({$match:{customerDistrict:{$exists: true},districtString:district.trim(),"status": "Successful",transactionDate:{$gte: monthStart}}},
                {$project: {'amount':1,'districtString':1,'paymentPlan':1}},
                {$group: {_id: "$paymentPlan",count:{$sum:1},total:{$sum: "$amount"}}},
                {$sort:{_id: 1}});


            while(await cursor2.hasNext()) {
                const doc = await cursor2.next();
                monthArray.push(doc);
            }
            // else{
            //     monthArray.push({_id:district,total:0})
            // }

            let monthData ={total:0,ppmCount:0,postpaidCount:0};

            if(monthArray.length>0){
                monthArray.map(data=>{
                    monthData.total += data.total;
                    if(data._id==='Postpaid'){
                        monthData.postpaidCount = data.count;
                    }else
                        monthData.ppmCount = data.count;
                })
            }

            var result = {district:district,transactions: queryResult[0].transactions,daytotal:queryResult[0].daytotal,
                mtd:monthData.total,mtdPrepaidCount:monthData.ppmCount, mtdPostpaidCount:monthData.postpaidCount};
            //console.log("result>>>",result);
            res.send(result);

        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
})

router.get('/allcollections', function(req, res, next) {
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
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
            const col = db.collection('transaction');
            var dayStart = moment().startOf('day').toISOString(true);
            console.log("DayStart>>>",dayStart);

            const cursor = col.aggregate({$match:{customerDistrict:{$exists: true},status:"Successful","transactionDate":{$gte: new Date(dayStart)}}},
                {$project: {'paymentPlan': 1,'amount':1,'districtString':1,status:1}},
                {$group: {_id: {district: "$status", plan: "$paymentPlan"},
                    count:{$sum:1},total:{$sum: "$amount"}}},
                {$group:{_id:"$_id.status",transactions:{$push:{plan: "$_id.plan",count: "$count",
                    total: "$total"}},daytotal: {$sum: "$total"}}},{$sort:{_id: 1}});

            // const cursor=col.aggregate({$match:{"status": "Successful",transactionDate:{$gte: new Date(dayStart)}}},
            //     {$project: {'amount':1,'paymentPlan':1}},{$group: {_id: "$paymentPlan",count:{$sum:1},total:{$sum: "$amount"},daytotal: {$sum: "$total"}}},{$sort:{_id: 1}});

                // {$group:{_id:"$_id.district",transactions:{$push:{plan: "$_id.plan",count: "$count",
                //     total: "$total"}},}},{$sort:{_id: 1}});
            if(await cursor.hasNext()) {
                const doc = await cursor.next();
                queryResult.push(doc);
            }else{
                queryResult.push({transactions:[{
                    "plan": "Postpaid",
                    "count": 0,
                    "total": 0
                },
                    {
                        "plan": "Prepaid",
                        "count": 0,
                        "total": 0
                    }],daytotal:0})
            }

            console.log("DaySummary>>>>",queryResult);

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 2);
            var monthStart = moment().startOf('month').toISOString(true);
            monthStart=monthStart.split("+")[0]+"Z"
            monthStart = new Date(monthStart);

            const cursor2 = col.aggregate({$match:{"status": "Successful",transactionDate:{$gte: monthStart}}},
                {$project: {'amount':1,'status':1,'paymentPlan':1}},{$group: {_id: "$paymentPlan",count:{$sum:1},total:{$sum: "$amount"}}},{$sort:{_id: 1}});


            // while(await cursor2.hasNext()) {
            //     const doc = await cursor2.next();
            //     monthArray.push(doc);
            // }

            while(await cursor2.hasNext()) {
                const doc = await cursor2.next();
                monthArray.push(doc);
            }
            // else{
            //     monthArray.push({total:0})
            // }

            let monthData ={total:0,ppmCount:0,postpaidCount:0};

            if(monthArray.length>0){
                monthArray.map(data=>{
                    monthData.total += data.total;
                    if(data._id==='Postpaid'){
                        monthData.postpaidCount = data.count;
                    }else
                        monthData.ppmCount = data.count;
                })
            }

            var result = {transactions: queryResult[0].transactions,daytotal:queryResult[0].daytotal,mtd:monthData.total,mtdPrepaidCount:monthData.ppmCount,
            mtdPostpaidCount:monthData.postpaidCount};

            res.send(result);

        } catch (err) {
            console.log(err.stack);
        }
        client.close();
    })();
})

router.get('/paymentcount',function(req,res){
    //console.log("Time>>>",new Date(moment().startOf("hour").toISOString()));
    const emails=["gfagbohun@enugudisco.com","udeshmukh@enugudisco.com"];
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
    const dbName = 'cashcollectiondb';
    let queryResult =[];
    (async function() {
        const client = new MongoClient(url);
        try {
            await client.connect();
            //console.log("Connected correctly to server");
            const db = client.db(dbName);
            const col = db.collection('transaction');

            var hour = moment().startOf('hour').toISOString(true);
            //hour=monthStart.split("+")[0]+"Z"
            hour = new Date(hour);
            console.log("time>>",hour);
            const cursor = col.aggregate([{$match:{"status": "Successful",transactionDate:{$gte: hour}}},
                {$group: {_id: "$paymentPlan",count:{$sum: 1}}}]);

            while(await cursor.hasNext()) {
                const docs = await cursor.next();
                //console.log("Doc>>>",doc);
                queryResult.push(docs);
            }

            for(var i=0;i<emails.length;i++){
                mailService.sendMailRequest(emails[i],"emailpaymentnotice",{payments:queryResult},res);
            }
            //console.log("Result>>",queryResult);
            res.send({Message: "Email sent successfully"});
        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
})

router.get('/user',function(req,res){
    const url = 'mongodb://paymentsummary:pmsAdmin@localhost:27017/?authMechanism=DEFAULT&authSource=admin';
    const dbName = 'cashcollectiondb';
    let queryResult =[];
    (async function() {
        const client = new MongoClient(url);
        try {
            await client.connect();
            console.log("Connected correctly to server");
            const db = client.db(dbName);
            const col = db.collection('usermaster');


            const user= await col.findOne({userName:req.query.username},{projection:{userId:1,userName:1,secondaryUserName:1,firstName:1,lastName:1,emailAddress:1}});


            console.log("User>>>>>>>>>>>>>>>",user);

            //const users=col.find({});

            //console.log("######Users##########",users);

            res.send(user);
        } catch (err) {
            console.log(err.stack);
        }
        // Close connection
        client.close();
    })();
})



module.exports = router;