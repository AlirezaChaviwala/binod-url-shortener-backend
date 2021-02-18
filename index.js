const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongodb = require('mongodb');
const shortid = require('shortid');
//const mongoose = require('mongoose');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb+srv://Alireza:FirstOrgDB@firstorgcluster.kphxs.mongodb.net/FirstOrgDB?retryWrites=true&w=majority';
const dbName = 'FirstOrgDB';

app.use(bodyParser.json());
app.use(cors({
    origin: 'https://happy-jones-a6ae4e.netlify.app/',
    optionsSuccessStatus: 200 // For legacy browser support
}));
app.listen(process.env.PORT || 8080);

app.post('/binodit', async(req, res) => {
    try {

        //Open the Connection
        let connection = await MongoClient.connect(url, { useNewUrlParser: true });

        //Select the DB
        let db = connection.db(dbName);

        //Perform push operation in DB
        await db.collection("binod").insertOne({ "ip": req.socket.remoteAddress, "long-url": req.body["long-url"], "short-url": shortid.generate(), "count": 0 });

        //Close connection
        connection.close();

        //console.log(req.body);
        res.status(200).json({
            message: 'got it',
            "short-url": code
        })
    } catch (err) {
        console.error(err);
    }
});


app.get('/redirect/:short', async(req, res) => {
    try {
        //Open the Connection
        let connection = await MongoClient.connect(url, { useNewUrlParser: true });

        //Select the DB
        let db = connection.db(dbName);

        //Perform find operation in DB
        let longUrl = await db.collection("binod").find({ "short-url": req.params.short }).toArray();
        await db.collection("binod").updateOne({ "short-url": req.params.short }, { $inc: { "count": 1 } });
        //Close connection
        connection.close();

        res.redirect(longUrl[0]["long-url"]);
    } catch (err) {
        console.error(err);
    }
});

app.get('/getRecords', async(req, res) => {
    try {
        //Open the Connection
        let connection = await MongoClient.connect(url, { useNewUrlParser: true });

        //Select the DB
        let db = connection.db(dbName);

        //Perform find operation in DB
        let rec = await db.collection("binod").find({ "ip": req.socket.remoteAddress }).toArray();

        //Close connection
        connection.close();

        res.status(200).send(rec);
    } catch (err) {
        console.error(err);
    }
});