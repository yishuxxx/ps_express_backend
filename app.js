var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
var Treeize   = require('treeize');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//____MIDDLEWARE END

var sequelize = new Sequelize('sycommy_shop', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },

});

app.get('/onsen', function (req, res) {
  res.render('onsen', { test: req.test });
})


app.get('/products', function (req, res) {

	var limit = req.query.limit ? req.query.limit : 5;
	var offset = parseInt(req.query.offset ? req.query.offset : 0);
	console.log(req.query);
	sequelize.query(
		`SELECT a.id_product FROM ps_product as a
		WHERE 1 LIMIT :limit OFFSET :offset`,
  	{ replacements: { limit: limit, offset: offset }, type: sequelize.QueryTypes.SELECT })
	.then(function(rows){
		
		if(rows.length < 1){
			res.send({success:false})
			return null;
		}

		var id_products = [];
		for(var i=0;i<rows.length;i++){
			id_products.push(rows[i].id_product); 
		}
		console.log(id_products);
		
		sequelize.query(
			`SELECT 
				a.id_product as id,
				b.name as name,
				f2.id_attribute as proattgros__atts__id,
				f2.name as proattgros__atts__name,
				h.id_attribute_group as proattgros__id,
				h.name as proattgros__name,
				a.price as price,
				a.price as quantity,
				i.id_image as images__id
			FROM ps_product as a
			JOIN ps_product_lang as b ON a.id_product=b.id_product
			JOIN ps_product_shop as c ON a.id_product=c.id_product
			JOIN ps_product_attribute as d ON a.id_product=d.id_product
			JOIN ps_product_attribute_combination as e ON d.id_product_attribute=e.id_product_attribute
			JOIN ps_attribute as f ON e.id_attribute=f.id_attribute
			JOIN ps_attribute_lang as f2 ON f.id_attribute=f2.id_attribute
			JOIN ps_attribute_group as g ON f.id_attribute_group=g.id_attribute_group
			JOIN ps_attribute_group_lang as h ON f.id_attribute_group=h.id_attribute_group
			JOIN ps_image as i ON a.id_product=i.id_product
			WHERE a.id_product IN(:id_products) AND (b.id_lang=1 AND c.id_shop=1 AND f2.id_lang=1 AND h.id_lang=1)
			ORDER BY a.id_product,h.id_attribute_group,f2.id_attribute`,
		  { replacements: { id_products: id_products }, type: sequelize.QueryTypes.SELECT }
		).then(function(rows) {
			/*
			var id_products = [];
			for(var i=0;i<rows.length;i++){
				id_products.indexOf(rows[i].id_product) == -1 ? id_products.push(rows[i].id_product) : '';
			}
			for(var i=0;i<id_products.length;i++){
				rows.filter(function(element){return element.id_product == id_products[j];});
			}
			var newRows = [];
			for(var i=0;i<rows.length;i++){
				newRows.push({});
				for(var name in rows[i]){
					console.log(rows[i][name]);
					newRows[i][name.replace(/___/g,':')] = rows[i][name];
				}
			}
	*/
			var productTree = new Treeize()
				.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
				.grow(rows)
			 	.getData();

		  	res.send({success:true,products:productTree});
		});


  	});
})

app.get('/product/:id', function (req, res) {
	
	sequelize.query(
		`SELECT 
			a.id_product as id,
			b.name as name,
			b.*,
			f2.id_attribute as proattgros__atts__id,
			f2.name as proattgros__atts__name,
			h.id_attribute_group as proattgros__id,
			h.name as proattgros__name,
			a.price as price,
			a.price as quantity,
			i.id_image as images__id
		FROM ps_product as a
		JOIN ps_product_lang as b ON a.id_product=b.id_product
		JOIN ps_product_shop as c ON a.id_product=c.id_product
		JOIN ps_product_attribute as d ON a.id_product=d.id_product
		JOIN ps_product_attribute_combination as e ON d.id_product_attribute=e.id_product_attribute
		JOIN ps_attribute as f ON e.id_attribute=f.id_attribute
		JOIN ps_attribute_lang as f2 ON f.id_attribute=f2.id_attribute
		JOIN ps_attribute_group as g ON f.id_attribute_group=g.id_attribute_group
		JOIN ps_attribute_group_lang as h ON f.id_attribute_group=h.id_attribute_group
		JOIN ps_image as i ON a.id_product=i.id_product
		WHERE a.id_product IN(:id_product) AND (b.id_lang=1 AND c.id_shop=1 AND f2.id_lang=1 AND h.id_lang=1)
		ORDER BY a.id_product,h.id_attribute_group,f2.id_attribute`,
	  { replacements: { id_product: req.params.id }, type: sequelize.QueryTypes.SELECT }
	).then(function(rows) {

		var productTree = new Treeize()
			.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
			.grow(rows)
		 	.getData();

	  	res.send({success:true,products:productTree});
	});
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
