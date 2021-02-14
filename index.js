const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
//const mongodb = require('mongodb');
//const MongoClient = mongodb.MongoClient;

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    optionsSuccessStatus: 200 // For legacy browser support
}))
app.listen(8080);

app.post('/binodit', (req, res) => {
    console.log(req.body);
    console.log('yo');
    console.log(req.connection);
    res.status(200).send({ message: 'got it' })
});