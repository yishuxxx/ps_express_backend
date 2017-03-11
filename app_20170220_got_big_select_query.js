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
var helper = require('./helper');
var md5 = require('crypto-js/md5');

//var {SYCustomer, Customer} = require('./src/models/customer');

var app = express();

const _COOKIE_KEY_ = 'tdbbE5CUZ3pEzUVgSv7JPibBbmyVz7Dkdgifysdg18YCAzummGUxPpyb';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//____MIDDLEWARE END

var sequelize = new Sequelize('sycommy_shop', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },

});

var {CustomerFunc} = require('./src/models/customer');
var Customer = CustomerFunc(Sequelize,sequelize);
var {OrderFunc} = require('./src/models/order');
var Order = OrderFunc(Sequelize,sequelize);

var {SYOrderFunc} = require('./src/models/sy_order');
var SYOrder = SYOrderFunc(Sequelize,sequelize);

var {OrderDetailFunc} = require('./src/models/order_detail');
var OrderDetail = OrderDetailFunc(Sequelize,sequelize);
var {OrderCarrierFunc} = require('./src/models/order_carrier');
var OrderCarrier = OrderCarrierFunc(Sequelize,sequelize);
var {OrderStateFunc} = require('./src/models/order_state');
var OrderState = OrderStateFunc(Sequelize,sequelize);
var {OrderStateLangFunc} = require('./src/models/order_state_lang');
var OrderStateLang = OrderStateLangFunc(Sequelize,sequelize);
var {OrderPaymentFunc} = require('./src/models/order_payment');
var OrderPayment = OrderPaymentFunc(Sequelize,sequelize);
var {OrderHistoryFunc} = require('./src/models/order_history');
var OrderHistory = OrderHistoryFunc(Sequelize,sequelize);

var {AddressFunc} = require('./src/models/address');
var Address = AddressFunc(Sequelize,sequelize);

Customer.hasMany(Order,{foreignKey:'id_order'});

Order.hasOne(SYOrder,{foreignKey:'id_order'});
Order.hasMany(OrderDetail, {foreignKey:'id_order'});
Order.hasOne(OrderCarrier, {foreignKey:'id_order'});
// Order hasOne OrderPayment change to belongsTo, workaround for targetKey bug
Order.belongsTo(OrderPayment, {foreignKey:'reference',targetKey:'order_reference'});
Order.belongsTo(OrderState, {foreignKey:'current_state'});
Order.hasMany(OrderDetail, {foreignKey:'id_order'});
Order.hasOne(OrderHistory, {foreignKey:'id_order',targetKey:'id_order'});
Order.belongsTo(Address,{foreignKey:'id_address_delivery',targetKey:'id_address'});
Order.belongsTo(Customer,{foreignKey:'id_customer',targetKey:'id_customer'});


OrderState.hasOne(OrderStateLang, {foreignKey : 'id_order_state'});
OrderPayment.hasOne(Order, {foreignKey:'reference',targetKey:'order_reference'});

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
			LEFT JOIN ps_product_attribute as d ON a.id_product=d.id_product
			LEFT JOIN ps_product_attribute_combination as e ON d.id_product_attribute=e.id_product_attribute
			LEFT JOIN ps_attribute as f ON e.id_attribute=f.id_attribute
			LEFT JOIN ps_attribute_lang as f2 ON f.id_attribute=f2.id_attribute
			LEFT JOIN ps_attribute_group as g ON f.id_attribute_group=g.id_attribute_group
			LEFT JOIN ps_attribute_group_lang as h ON f.id_attribute_group=h.id_attribute_group
			LEFT JOIN ps_image as i ON a.id_product=i.id_product
			WHERE a.id_product IN(:id_products) AND (b.id_lang=1 AND c.id_shop=1)
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
		LEFT JOIN ps_product_attribute as d ON a.id_product=d.id_product
		LEFT JOIN ps_product_attribute_combination as e ON d.id_product_attribute=e.id_product_attribute
		LEFT JOIN ps_attribute as f ON e.id_attribute=f.id_attribute
		LEFT JOIN ps_attribute_lang as f2 ON f.id_attribute=f2.id_attribute
		LEFT JOIN ps_attribute_group as g ON f.id_attribute_group=g.id_attribute_group
		LEFT JOIN ps_attribute_group_lang as h ON f.id_attribute_group=h.id_attribute_group
		LEFT JOIN ps_image as i ON a.id_product=i.id_product
		WHERE a.id_product IN(:id_product) AND (b.id_lang=1 AND c.id_shop=1)
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

app.get('/categories',function(req, res){
	sequelize.query(
		`SELECT 
			a.id_category as id,
			a.id_parent as id_parent,
			b.name as name
		FROM ps_category AS a
		LEFT JOIN ps_category_lang as b ON a.id_category=b.id_category
		WHERE b.id_lang=1
		ORDER BY a.id_category`,
	{type:sequelize.QueryTypes.SELECT})
	.then(function(rows){
		rows.push({id:0,id_parent:null});
		var rootNode = helper.treeify(rows,'id','id_parent','children');

		res.send({success:true,data:rootNode[0].children[0].children[0].children});
	})
})

app.get('/order/:id',function(req, res){

	sequelize.query(
		`SELECT * FROM order WHERE id_order=:id_order`,
	{replacements:{id_order:req.params.id},type:sequelize.QueryTypes.SELECT})
	.then(function(rows){

	})

	sequelize.query(
		`SELECT a.id_order as id_order,
		a.reference as reference,
		a.id_carrier as carrier__id_carrier,
		a.id_customer as customer__id_customer,
		a.id_address_delivery as delivery__id_address_delivery,
		a.id_address_invoice as invoice__id_address_invoice,
		a.payment as payment_method,
		a.current_state as current_state,
		a.date_add as date_add,
		a.date_upd as date_upd,
		b.name as carrier__name,
		a2.tracking_number as carrier__tracking_number,
		a2.shipping_cost_tax_incl as carrier__shipping_cost,
		a3.product_id as products__id,
		a3.product_attribute_id as products__id_product_attribute,
		a3.product_name as products__name,
		a3.product_quantity as products__quantity,
		c.company as customer__company,
		c.firstname as customer__firstname,
		c.lastname as customer__lastname,
		c.email as customer__email,
		c.is_guest as customer__is_guest,
		e.firstname as delivery__firstname,
		e.lastname as delivery__lastname,
		e.company as delivery__company,
		e.phone as delivery__phone,
		e.address1 as delivery__address1,
		e.address2 as delivery__address2,
		e.postcode as delivery__postcode,
		e.city as delivery__city,
		e2.firstname as invoice__firstname,
		e2.lastname as invoice__lastname,
		e2.company as invoice__company,
		e2.phone as invoice__phone,
		e2.address1 as invoice__address1,
		e2.address2 as invoice__address2,
		e2.postcode as invoice__postcode,
		e2.city as invoice__city
		FROM ps_orders as a
		JOIN ps_order_carrier as a2 ON a.id_order=a2.id_order
		JOIN ps_order_detail as a3 ON a.id_order=a3.id_order
		JOIN ps_order_state as a4 ON a.current_state=a4.id_order_state
		JOIN ps_order_state_lang as a4l ON a4.id_order_state=a4l.id_order_state
		LEFT JOIN ps_carrier as b ON a.id_carrier = b.id_carrier
		LEFT JOIN ps_carrier_lang as b2 ON a.id_carrier = b2.id_carrier
		JOIN ps_customer as c ON a.id_customer = c.id_customer
		LEFT JOIN ps_product as d ON a3.product_id = d.id_product
		LEFT JOIN ps_address as e ON a.id_address_delivery = e.id_address
		LEFT JOIN ps_address as e2 ON a.id_address_invoice = e2.id_address
		WHERE b2.id_lang=1 AND a4l.id_lang=1 AND a.id_order=:id_order`,
	{replacements:{id_order:req.params.id},type:sequelize.QueryTypes.SELECT})
	.then(function(rows){

		var rootNode = new Treeize()
			.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
			.grow(rows)
		 	.getData();

		//res.render('inputpage',{data:rootNode});
		res.send({success:true,data:rootNode});
	})

})

app.get('/orders',function(req, res){

	var limit = req.query.limit ? req.query.limit : 100;
	var offset = parseInt(req.query.offset ? req.query.offset : 0);

	sequelize.query(
		`SELECT a.id_order as id_order,
		a.reference as reference,
		a.id_carrier as carrier__id,
		a.id_customer as customer__id,
		a.id_address_delivery as delivery__id_address_delivery,
		a.id_address_invoice as invoice__id_address_invoice,
		a.payment as payment_method,
		a.current_state as current_state,
		a.total_products_wt as total_products_wt,
		a.total_shipping_tax_incl as total_shipping_tax_incl,
		a.total_discounts_tax_incl as total_discounts_tax_incl,
		a.total_paid as total_paid,
		a.date_add as date_add,
		b.name as carrier__name,
		a2.tracking_number as carrier__tracking_number,
		a2.shipping_cost_tax_incl as carrier__shipping_cost_tax_incl,
		a3.product_id as products__id,
		a3.product_attribute_id as products__id_product_attribute,
		a3.product_name as products__name,
		a3.product_quantity as products__quantity,
		a3.unit_price_tax_incl as products__unit_price_tax_incl,
		a4l.name as status_name,
		a6.id_order_payment as payment__id_order_payment,
		a6.date_add as payment__date_add,
		a6.amount as payment__amount,
		a6.payment_method as payment__method,
		c.company as customer__company,
		c.firstname as customer__firstname,
		c.lastname as customer__lastname,
		c.email as customer__email,
		c.is_guest as customer__is_guest,
		d.reference as products__reference,
		e.firstname as delivery__firstname,
		e.lastname as delivery__lastname,
		e.company as delivery__company,
		e.phone as delivery__phone,
		e.address1 as delivery__address1,
		e.address2 as delivery__address2,
		e.postcode as delivery__postcode,
		e.city as delivery__city,
		e2.firstname as invoice__firstname,
		e2.lastname as invoice__lastname,
		e2.company as invoice__company,
		e2.phone as invoice__phone,
		e2.address1 as invoice__address1,
		e2.address2 as invoice__address2,
		e2.postcode as invoice__postcode,
		e2.city as invoice__city
		FROM ps_orders as a
		JOIN ps_order_carrier as a2 ON a.id_order=a2.id_order
		JOIN ps_order_detail as a3 ON a.id_order=a3.id_order
		JOIN ps_order_state as a4 ON a.current_state=a4.id_order_state
		JOIN ps_order_state_lang as a4l ON a4.id_order_state=a4l.id_order_state
		LEFT JOIN ps_order_invoice_payment as a5 ON a.id_order=a5.id_order
		LEFT JOIN ps_order_payment as a6 ON a5.id_order_payment=a6.id_order_payment
		LEFT JOIN ps_carrier as b ON a.id_carrier = b.id_carrier
		LEFT JOIN ps_carrier_lang as b2 ON a.id_carrier = b2.id_carrier
		JOIN ps_customer as c ON a.id_customer = c.id_customer
		LEFT JOIN ps_product as d ON a3.product_id = d.id_product
		LEFT JOIN ps_address as e ON a.id_address_delivery = e.id_address
		LEFT JOIN ps_address as e2 ON a.id_address_invoice = e2.id_address
		WHERE b2.id_lang=1 AND a4l.id_lang=1
		LIMIT :limit OFFSET :offset`,
	{replacements:{limit:limit, offset:(req.query.offset?req.query.offset : 0)},type:sequelize.QueryTypes.SELECT})
	.then(function(rows){

		var rootNode = new Treeize()
			.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
			.grow(rows)
		 	.getData();

		//res.send({success:true,data:rootNode});
		res.render('orders',{data:rootNode});
	})

})

app.get('/inputpage',function(req,res){
	var id_customer = req.query.id_customer ? req.query.id_customer : null;
	var id_order = req.query.id_order ? req.query.id_order : null;
	Customer.scope('admin').findById(id_customer)
	.then(function(customer) {
		res.render('inputpage',{data:{customer:customer}});
	});
})

app.get('/search/:table',function(req,res){

	if(req.params.table == 'customer'){
		if(req.query.email){
			sequelize.query(
				`	SELECT 
						a.email as customers__email,
						a.id_customer as customers__id_customer
					FROM ps_customer as a
					WHERE a.email LIKE :email`,
				
			{replacements:{email:'%'+req.query.email+'%'},type:sequelize.QueryTypes.SELECT})
			.then(function(rows){

				var rootNode = new Treeize()
					.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
					.grow(rows)
				 	.getData();

				res.send({success:true,data:rootNode});
			})
		}
	}
})

app.get('/customer/create',function(req,res){

	var customer = Customer.build({
		firstname:req.query.firstname,
		lastname:(req.query.lastname ? req.query.lastname : ''),
		email:req.query.email,
		passwd:(req.query.passwd ? md5(_COOKIE_KEY_+req.query.passwd).toString() : 'e1767dc27c8a1f673cd5d8e5fa2387cb'),
		secure_key:md5(Math.random()+'').toString()
	});
	customer.save()
		.then(function(customer){
			return SYCustomer.build({
				id_customer:customer.id_customer,
				fbuser_id:'1',
				fbuser_name:(req.query.fbuser_name?req.query.fbuser_name:'')
			}).save();
		})
		.then(function(sycustomer){
			return Customer.scope('admin').findOne({
				where:{email:customer.email},
			});
		})
		.then(function(customer){
			res.send(customer);
		})
		.catch(Sequelize.ValidationError, function(error){
			res.send(error.message);
		});
})

app.get('/customer/:id',function(req,res){
	if(req.params.id){
		sequelize.query(
			`	SELECT * FROM ps_customer
				WHERE id_customer=:id`,
		{replacements:{id:req.params.id},type:sequelize.QueryTypes.SELECT})
		.then(function(rows){

			var rootNode = new Treeize()
				.setOptions({ input: { delimiter: '__',uniformRows: 'enabled'}})
				.grow(rows)
			 	.getData();

			res.send({success:true,data:rootNode});
		})
	}
})

app.get('/tableschema/:table',function(req,res){
	sequelize.getQueryInterface().describeTable(req.params.table).then(function(rows){
		res.send(rows);
	})
})

app.get('/table/:table/:id',function(req,res){
	switch(req.params.table){
		case 'order':
			
			var result = [];
			Order.scope('admin').findOne({
			    include: [{
			    	model:SYOrder.scope('admin')
			    },{
			        model: OrderDetail.scope('admin')
			    },{
			        model: OrderCarrier.scope('admin')
			    },{
			        model: OrderPayment.scope('admin'),
			    },{
			    	model: OrderState.scope('admin'),
			    	include: [{
			    		model: OrderStateLang.scope('admin')
			    	}]
				},{
					model: OrderHistory.scope('admin')
				},{
					model: Address.scope('admin')
				}],
				where:{id_order:req.params.id}

			}).then(function(row){
				result.push(row);
				return OrderPayment.scope('admin').findAll({where:{order_reference:row.reference}});
			}).then(function(rows){
				result[0].setDataValue('OrderPayment222',rows);
				res.send(result[0]);
			});
			
			/*
			var promises = [];

			promises[0] = 
				Order.scope('admin').findOne({
				    include: [{
				        model: OrderDetail.scope('admin')
				    },{
				        model: OrderCarrier.scope('admin')
				    }],
					where:{id_order:req.params.id}
				});

			Sequelize.Promise.all(promises)
			.then(function(promises){
				var output = [];
					promises[0]['query2'] = promises[1];
				res.send(promises);
			});
			*/
			break;
		default:
			res.send({success:false,message:'no matching table'});

	}
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
