const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        family: 4
    })
    .then(() => {
        console.log('connection established');
    })
    .catch(err => {
        console.error(err.message);
    });

mongoose.connection.on('connected', () => {
    console.log('connected to Db');
})

mongoose.connection.on('error', (err) => {
    console.error(err.message);
})

mongoose.connection.on('disconnected', () => {
    console.log('disconnected from the db')
})

process.on('SIGINT', async() => {
    await mongoose.connection.close();
    process.exit(0);
})