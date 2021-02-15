const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'b18wd';

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    optionsSuccessStatus: 200 // For legacy browser support
}));
app.listen(8080);

app.post('/binodit', async(req, res) => {

    var chars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", , '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    var code = '';
    for (let i = 0; i < 7; i++) {
        var num = Math.round(Math.random() * (chars.length));
        code += chars[num];
    }
    //console.log(code);
    //Open the Connection
    let connection = await MongoClient.connect(url);

    //Select the DB
    let db = connection.db(dbName);

    //Perform push operation in DB
    await db.collection("binod").insertOne({ "ip": req.socket.remoteAddress, "long-url": req.body["long-url"], "short-url": code, "count": 0 });

    //Close connection
    connection.close();

    //console.log(req.body);
    res.status(200).send({ message: 'got it' })
});


app.get('/:short', async(req, res) => {
    //Open the Connection
    let connection = await MongoClient.connect(url);

    //Select the DB
    let db = connection.db(dbName);

    //Perform push operation in DB
    let longUrl = await db.collection("binod").find({ "short-url": req.params.short });

    //Close connection
    connection.close();

    res.redirect();
})