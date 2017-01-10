var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', index);
//app.use('/users', users);
app.get('/onsen', function (req, res) {
  res.render('onsen', { test: req.test });
})

app.get('/users/:userId/books/:bookId', function (req, res) {
  res.send(req.params)
})

app.get('/mysqltest', function (req, res) {
	var mysql = require('mysql')
	var connection = mysql.createConnection({
	  host: 'localhost',
	  user: 'root',
	  password: ''
	})
	connection.connect();
	var qs = 'USE sycommy_prestashop;';
	var qs2 = 'SELECT * FROM ps_orders WHERE 1;'

	connection.query(qs, function (err, rows, fields) {
	  if (err) throw err
	})

	connection.query(qs2, function (err, rows, fields) {
	  if (err) throw err

	  res.send(rows)
	})

	connection.end();
})



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
