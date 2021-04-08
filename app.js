var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
//var indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
require('./helpers/init_mongodb');

const app = express();

app.use(cors());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(async(req, res, next) => {
    next(createError.NotFound());
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    console.log(err.message, err.status);
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status,
            message: err.message
        }
    });
});

module.exports = app;