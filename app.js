var express = require('express');
var https = require('https');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var session = require('express-session');
var request = require('request');
var rq = require('request-promise');
var crypto = require('crypto');

var Sequelize = require('sequelize');
var Treeize   = require('treeize');

//var index = require('./routes/index');
//var users = require('./routes/users');
var Msg = require("./routes/msg");

var helper = require('./src/Utils/Helper');
var md5 = require('crypto-js/md5');
var {settings} = require('./settings');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();

var debug = require('debug')('express-skel:server');
var http = require('http');
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

const _COOKIE_KEY_ = settings._COOKIE_KEY_;

var sequelize = new Sequelize(settings.db_name, settings.db_user, settings.db_passwd, {
  host: settings.db_host,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },

});
var msg = new Msg(express,request,rq,crypto,settings,Sequelize,sequelize,io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.locals.base_dir = settings.base_dir;

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//for login session
app.use(session({
    secret: 'keyboard cat',
    proxy: true,
    resave: true,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
//for routing
app.use('/msg', msg.router);

//____MIDDLEWARE END

var isUnique = function (modelName, field) {

  return function(value, next) {
	sequelize.query(
		`SELECT a.email FROM ps_customer as a WHERE a.email=:email`,
  	{ replacements: { email: value }, type: sequelize.QueryTypes.SELECT }).then(function(rows){
      if (rows.length !== 0) {
        next("email is already in use");
      } else {
        next();
      }
  	});

  };
};
var {uniqueValidatorFunc} = require('./src/models/custom_validator/unique_validator');
var uniqueValidator = uniqueValidatorFunc(sequelize,null,null);

var {CountryFunc} = require('./src/models/country');
var Country = CountryFunc(Sequelize,sequelize);
var {ZoneFunc} = require('./src/models/zone');
var Zone = ZoneFunc(Sequelize,sequelize);
var {StateFunc} = require('./src/models/state');
var State = StateFunc(Sequelize,sequelize);

var {CarrierFunc} = require('./src/models/carrier');
var Carrier = CarrierFunc(Sequelize,sequelize);
var {DeliveryFunc} = require('./src/models/delivery');
var Delivery = DeliveryFunc(Sequelize,sequelize);
var {RangePriceFunc} = require('./src/models/range_price');
var RangePrice = RangePriceFunc(Sequelize,sequelize);
var {RangeWeightFunc} = require('./src/models/range_weight');
var RangeWeight = RangeWeightFunc(Sequelize,sequelize);
var {CarrierZoneFunc} = require('./src/models/carrier_zone');
var CarrierZone = CarrierZoneFunc(Sequelize,sequelize);

var {CartFunc} = require('./src/models/cart');
var Cart = CartFunc(Sequelize,sequelize);
var {CartRuleFunc} = require('./src/models/cart_rule');
var CartRule = CartRuleFunc(Sequelize,sequelize);
var {SpecificPriceFunc} = require('./src/models/specific_price');
var SpecificPrice = SpecificPriceFunc(Sequelize,sequelize);

var {EmployeeFunc} = require('./src/models/employee');
var Employee = EmployeeFunc(Sequelize,sequelize);
var {CustomerFunc} = require('./src/models/customer');
var Customer = CustomerFunc(Sequelize,sequelize,uniqueValidator);
//var {SYCustomerFunc} = require('./src/models/sy_customer');
//var SYCustomer = SYCustomerFunc(Sequelize,sequelize);
var {GroupFunc} = require('./src/models/group');
var Group = GroupFunc(Sequelize,sequelize);
var {CustomerGroupFunc} = require('./src/models/customer_group');
var CustomerGroup = CustomerGroupFunc(Sequelize,sequelize);

var {AddressFunc} = require('./src/models/address');
var Address = AddressFunc(Sequelize,sequelize);

var {OrderFunc} = require('./src/models/order');
var Order = OrderFunc(Sequelize,sequelize);
//var {SYOrderFunc} = require('./src/models/sy_order');
//var SYOrder = SYOrderFunc(Sequelize,sequelize);
var {SYPageFunc} = require('./src/models/sy_page');
var SYPage = SYPageFunc(Sequelize,sequelize);

var {OrderDetailFunc} = require('./src/models/order_detail');
var OrderDetail = OrderDetailFunc(Sequelize,sequelize);
var {OrderCarrierFunc} = require('./src/models/order_carrier');
var OrderCarrier = OrderCarrierFunc(Sequelize,sequelize);
var {OrderStateFunc} = require('./src/models/order_state');
var OrderState = OrderStateFunc(Sequelize,sequelize);
var {OrderStateLangFunc} = require('./src/models/order_state_lang');
var OrderStateLang = OrderStateLangFunc(Sequelize,sequelize);
var {OrderInvoiceFunc} = require('./src/models/order_invoice');
var OrderInvoice = OrderInvoiceFunc(Sequelize,sequelize);
var {OrderInvoicePaymentFunc} = require('./src/models/order_invoice_payment');
var OrderInvoicePayment = OrderInvoicePaymentFunc(Sequelize,sequelize);
var {OrderPaymentFunc} = require('./src/models/order_payment');
var OrderPayment = OrderPaymentFunc(Sequelize,sequelize);
var {OrderHistoryFunc} = require('./src/models/order_history');
var OrderHistory = OrderHistoryFunc(Sequelize,sequelize);
var {OrderCartRuleFunc} = require('./src/models/order_cart_rule');
var OrderCartRule = OrderCartRuleFunc(Sequelize,sequelize)

var {ProductFunc} = require('./src/models/product');
var Product = ProductFunc(Sequelize,sequelize);
var {ProductAttributeFunc} = require('./src/models/product_attribute');
var ProductAttribute = ProductAttributeFunc(Sequelize,sequelize);
var {ProductLangFunc} = require('./src/models/product_lang');
var ProductLang = ProductLangFunc(Sequelize,sequelize);

var {TaxFunc} = require('./src/models/tax');
var Tax = TaxFunc(Sequelize,sequelize);
var {TaxLangFunc} = require('./src/models/tax_lang');
var TaxLang = TaxLangFunc(Sequelize,sequelize);
var {TaxRuleFunc} = require('./src/models/tax_rule');
var TaxRule = TaxRuleFunc(Sequelize,sequelize);
var {TaxRulesGroupFunc} = require('./src/models/tax_rules_group');
var TaxRulesGroup = TaxRulesGroupFunc(Sequelize,sequelize);
var {TaxRulesGroupShopFunc} = require('./src/models/tax_rules_group_shop');
var TaxRulesGroupShop = TaxRulesGroupShopFunc(Sequelize,sequelize);

Address.belongsTo(State,{foreignKey:'id_state'});
State.belongsTo(Zone,{foreignKey:'id_zone',targetKey:'id_zone'});
Zone.belongsToMany(Carrier, {through: CarrierZone, foreignKey:'id_zone',otherKey:'id_carrier'});
Carrier.belongsToMany(Zone, {through: CarrierZone, foreignKey:'id_carrier',otherKey:'id_zone'});
Carrier.hasMany(RangePrice,{foreignKey:'id_carrier'});
Carrier.hasMany(RangeWeight,{foreignKey:'id_carrier'});
Delivery.belongsTo(Carrier,{foreignKey:'id_carrier'});
Delivery.belongsTo(Zone,{foreignKey:'id_zone'});
Delivery.belongsTo(RangeWeight,{foreignKey:'id_range_weight'});
Delivery.belongsTo(RangePrice,{foreignKey:'id_range_price'});

Country.hasMany(State,{foreignKey:'id_country',targetKey:'id_country'});
Zone.hasMany(State,{foreignKey:'id_zone',targetKey:'id_zone'});
State.belongsTo(Country,{foreignKey:'id_country',targetKey:'id_country'});

Customer.hasMany(Order,{foreignKey:'id_customer'});
Customer.belongsToMany(Group, {through: CustomerGroup});
Group.belongsToMany(Customer, {through: CustomerGroup});
//Customer.hasOne(SYCustomer,{foreignKey:'id_customer'});

//Order.hasOne(SYOrder,{foreignKey:'id_order',targetKey:'id_order'});
//SYOrder.belongsTo(SYPage,{foreignKey:'id_sypage'});
Order.belongsTo(SYPage, {foreignKey:'id_sypage'});
SYPage.hasMany(Order, {foreignKey:'id_sypage'});
Order.hasMany(OrderDetail, {foreignKey:'id_order'});
Order.hasOne(OrderInvoice,{foreignKey:'id_order'});
Order.hasOne(OrderCarrier, {foreignKey:'id_order'});
// Order hasOne OrderPayment change to belongsTo, workaround for targetKey bug
//Order.hasMany(OrderPayment, {foreignKey:'order_reference',targetKey:'reference',sourceKey:'reference',key:'reference'});
Order.belongsTo(OrderState, {foreignKey:'current_state',targetKey:'id_order_state'});
Order.hasOne(OrderHistory, {foreignKey:'id_order',targetKey:'id_order'});
Order.belongsTo(Address,{foreignKey:'id_address_delivery',targetKey:'id_address'});
Order.belongsTo(Customer,{foreignKey:'id_customer',targetKey:'id_customer'});
Order.belongsTo(Cart,{foreignKey:'id_cart',targetKey:'id_cart'});

Order.belongsToMany(OrderPayment, {through: OrderInvoicePayment, foreignKey:'id_order', otherKey:'id_order_payment'});
OrderPayment.belongsToMany(Order, {through: OrderInvoicePayment, foreignKey:'id_order_payment', otherKey:'id_order'});

Order.hasMany(OrderCartRule,{foreignKey:'id_order',targetKey:'id_order'});
OrderCartRule.belongsTo(CartRule,{foreignKey:'id_cart_rule',targetKey:'id_cart_rule'});
Cart.belongsTo(CartRule,{foreignKey:'id_cart_rule',targetKey:'id_cart_rule'});

OrderState.hasOne(OrderStateLang, {foreignKey : 'id_order_state'});
//OrderPayment.hasOne(Order, {foreignKey:'reference',targetKey:'order_reference'});
OrderDetail.belongsTo(ProductAttribute, {foreignKey:'product_attribute_id',targetKey:'id_product_attribute'});
OrderDetail.belongsTo(Product, {foreignKey: 'product_id',targetKey:'id_product'});

ProductAttribute.hasMany(OrderDetail, {foreignKey: 'product_attribute_id',targetKey:'id_product_attribute'});
ProductAttribute.hasMany(SpecificPrice,{foreignKey:'id_product_attribute',targetKey:'id_product_attribute'})

Product.hasMany(ProductAttribute,{foreignKey:'id_product'});
Product.hasMany(ProductLang,{foreignKey:'id_product'});
Product.hasMany(SpecificPrice,{foreignKey:'id_product',targetKey:'id_product'});

ProductAttribute.belongsTo(Product, {foreignKey:'id_product'});
Product.belongsTo(TaxRulesGroup, {foreignKey:'id_tax_rules_group'});
TaxRulesGroup.hasMany(TaxRule, {foreignKey:'id_tax_rules_group'});
TaxRule.belongsTo(Tax, {foreignKey:'id_tax'});
Tax.hasMany(TaxLang, {foreignKey:'id_tax'});

var order_include = 
	[{
		model:SYPage.scope('admin')
	},{
	    model: OrderDetail.scope('admin'),
		order:'`id_order_detail` DESC',
	    include:[{
	    	model:ProductAttribute.scope('admin')
	    },{
	    	model:Product.scope('admin')
	    }]
	},{
	    model: OrderCarrier.scope('admin')
	},{
		model: OrderPayment.scope('admin')
	},{
		model: OrderState.scope('admin'),
		include: [{
			model: OrderStateLang.scope('admin')
		}]
	},{
		model: OrderHistory.scope('admin')
	},{
		model: Address.scope('admin'),
		include:[{
			model: State.scope('admin'),
			include:[{
				model: Zone.scope('admin'),
				include: [{
					model:Carrier.scope('admin')
				}]
			}]
		}]
	},{
		model: OrderCartRule.scope('admin')
	}];

var product_attribute_admin_include = 
 	[{
 		model:Product.scope('admin'),
 		include:[{
 			model:ProductLang.scope('admin')
 		},{
 			model:TaxRulesGroup.scope('admin'),
 			include:[{
 				model:TaxRule.scope('admin'),
 				include:[{
 					model:Tax.scope('admin'),
 					include:[{
 						model:TaxLang.scope('admin')
 					}]
 				}]
 			}]
 		}]
 	}];

var customer_admin_include = 
	[{
		model:Order.scope('admin')
	}];

var updateOrderDependencies = function(Order){
	var r = {};
	var tax_multiplier = 1;
	var total_products = 0;
	var total_discounts = 0;
	var free_shipping = 0;
	var total_shipping = 0;
	var total_weight = 0;
	var id_zone;
	var id_carrier;
	var total_paid = 0;

	return Tax.scope('admin').findOne({
		where:{id_tax:4}
	}).then(function(Instance){
		r.Order = Order;
		r.Tax = Instance;

		/*** CALCULATE TAX MULTIPLIER ***/
		tax_multiplier = ((100.00+r.Tax.rate)/100);

		/*** CALCULATE TOTAL_PRODUCTS ***/
		if(r.Order && r.Order.OrderDetails){
			for(var i=0;i<r.Order.OrderDetails.length;i++){
				total_products = total_products + r.Order.OrderDetails[i].total_price_tax_incl;
			}
		}

		/*** CALCULATE TOTAL_DISCOUNT ***/
		if(r.Order && r.Order.OrderCartRules){
			for(var i=0;i<r.Order.OrderCartRules.length;i++){
				if(r.Order.OrderCartRules[i].value_tax_excl){
					total_discounts = total_discounts + r.Order.OrderCartRules[i].value_tax_excl;
				}else if(r.Order.OrderCartRules[i].free_shipping){
					free_shipping = 1;
				}
			}
		}

		/*** CALCULATE TOTAL_PAID ***/
		if(r.Order.OrderPayments){
			r.Order.OrderPayments.map((OrderPayment,index) =>{
				total_paid = total_paid + OrderPayment.amount;
			})
		}		


		/*** CALCULATE TOTAL_SHIPPING ***/
		if(r.Order.Address && r.Order.Address.State && r.Order.OrderDetails){
		if(!r.Order.OrderCarrier.id_carrier){
			r.Order.OrderDetails.map((OrderDetail,index)=>{
				total_weight = total_weight + OrderDetail.product_weight;
			})
			r.Order.OrderCarrier ? id_carrier = r.Order.OrderCarrier.id_carrier : null;
			r.Order.Address.State ? id_zone = r.Order.Address.State.Zone.id_zone : null;
			if(id_carrier && id_zone){
				return Delivery.scope('admin').findOne({
					where:{id_zone:id_zone,id_carrier:id_carrier},
					include:[{
						model:RangeWeight.scope('admin'),
						where:{
							delimiter1:{$lte: total_weight},
							delimiter2:{$gt:total_weight}
						}
					}]
				});
			}
		}
		}
		
		return null;

	}).then(function(Instance){

		if(Instance){
			r.Delivery = Instance;
			total_shipping = r.Delivery.price;
		}else{
			total_shipping = r.Order.OrderCarrier.shipping_cost_tax_incl;
		}

		r.Order.total_products = total_products/tax_multiplier;
		r.Order.total_products_wt = total_products;

		r.Order.total_discounts = total_discounts;
		r.Order.total_discounts_tax_excl = total_discounts;
		r.Order.total_discounts_tax_incl = total_discounts*tax_multiplier;

		r.Order.total_shipping = total_shipping/tax_multiplier;
		r.Order.total_shipping_tax_excl = total_shipping/tax_multiplier;
		r.Order.total_shipping_tax_incl = total_shipping;

		r.Order.total_paid = r.Order.total_products + r.Order.total_shipping - r.Order.total_discounts;
		r.Order.total_paid_tax_excl = r.Order.total_products + r.Order.total_shipping_tax_excl - r.Order.total_discounts_tax_excl;
		r.Order.total_paid_tax_incl = r.Order.total_products_wt + r.Order.total_shipping_tax_incl - r.Order.total_discounts_tax_incl;

		r.Order.total_paid_real = total_paid;

		return r.Order.save();
	})
}

passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
	Employee.findOne({
		where:{email: email}
	}).then(function(Employee){
		done(null, {email:Employee.email});
	}).catch(function(err){
		if (err) { return done(err); }
	});
});

passport.use(new LocalStrategy( function(username, password, done) {

	Employee.findOne({
		where:{email: username}
	}).then(function(Employee){
	  if (!Employee) {
	  	console.log('Incorrect username.');
	    return done(null, false, { message: 'Incorrect username.' });
	  }
	  if (!(Employee.passwd.toLowerCase() === md5(_COOKIE_KEY_+password).toString().toLowerCase())) {
	  	console.log('Incorrect password.');
	  	console.log(Employee.passwd);
	  	console.log(md5(_COOKIE_KEY_+password).toString());
	    return done(null, false, { message: 'Incorrect password.' });
	  }
	  console.log('OK!');
	  return done(null, {email:Employee.email});

	}).catch(function(err){
		if (err) { return done(err); }
	});

}));

app.all([
	'/order/get/:id',
	'/order/update/:id',
	'/fastpage',
	'/inputpage'
],function(req,res,next){
	console.log('################## INSIDE req.user checking function');
	console.log(req.user);
    if(!req.user){
    	if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    		res.send({success:false,redirect:'/login',message:'Please login first'});
    	}else{
			res.redirect('/login?redirect='+req.path);
    	}
    }else{
    	next();
    }
});

app.all([
	'/order/get/:id',
	'/order/update/:id'
],function(req,res,next){
	Order.scope('admin').findOne({
	    include:order_include,
		where:{id_order:req.params.id}
	}).then(function(Instance){
		if(Instance){
			res.locals.Order = Instance;
			next();
		}else{
			console.log('this order does not exist');
			res.send({success:false,message:'this order does not exist'});
		}
	});
});

app.get('/login',function(req,res){
	res.render('./login',{data:{redirect:req.query.redirect}});
});
/*
app.post('/login',
  app.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/login' })),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    if(req.query.redirect){
    	res.redirect(req.query.redirect);
    }else{
    	res.redirect('/policies/privacy');
    }
});
*/
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return next(); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return next();
    });
  })(req, res, next);
},function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.

    if(req.user){
	    if(req.query.redirect){
	    	res.redirect(req.query.redirect);
	    }else{
	    	res.redirect('/policies/privacy');
	    }
	}else if(!req.user){
		res.redirect('/login?redirect='+req.query.redirect)
	}else{
		res.send({success:false,message:'error after login'});
	}
    
});

app.get('/logout',function(req,res,next){
    req.logout();
    req.session.destroy();
    res.redirect("/login");
});

app.get('/policies/privacy',function(req,res){
	res.render('./policies/privacy',{});
});

app.get('/privatereply',function(req,res){
	res.render('privatereply',{});
});

app.get('/onsen', function (req, res) {
  res.render('onsen', { test: req.test });
})

app.get('/products', function (req, res) {

	var limit = req.query.limit ? req.query.limit : 5;
	var offset = parseInt(req.query.offset ? req.query.offset : 0);

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
	}).catch(function(err){
		console.log(err);
		res.send({success:false,message:'exception occured'});
	})
})
/*
app.post('/order/createfast',function(req,res){
	var json = JSON.parse(req.query.json);
})
*/
app.post('/order/createfast', upload.array(), function (req, res, next) {
	var r = {};
	var q = req.body;
	q.passwd_tmp = helper.passwdGen(8,'NO_NUMERIC');
	q.passwd = md5(_COOKIE_KEY_+q.passwd_tmp).toString();
	var email_tmp = (q.firstname.replace(/[^\w]/g,'').toLowerCase())+helper.passwdGen(4,'NUMERIC')+'@customer.sy.com.my'
	q.email = (q.email ? q.email : email_tmp);
	q.id_carrier = 7;

	return sequelize.transaction().then(function (t) {

	Sequelize.Promise.all([
		Tax.scope('admin').findOne({where:{id_tax:4}}),
		SYPage.scope('admin').findAll()
	]).then(function(Instances){

		r.Tax = Instances[0];
		r.SYPages = Instances[1];
		return Customer.create({
			email: q.email,
			sy_fbuser_name: q.sy_fbuser_name,
			firstname: q.firstname,
			lastname: '',
			passwd:q.passwd,
			last_passwd_gen:sequelize.fn('NOW'),
			secure_key:md5(helper.passwdGen(9,'NO_NUMERIC')).toString()
		}, {transaction: t});

	}).then(function (Instance) {

		r.Customer = Instance;
		return Address.create({
			id_customer 		: r.Customer.id_customer,
			firstname 			: q.firstname,
			lastname 			: '',
			phone 				: q.phone,
			address1 			: q.address1,
			postcode 			: q.postcode,
			id_state 			: q.id_state,
			id_country 			: 136,
			alias 				: 'My Address'
		}, {transaction: t});
	}).then(function(Instance){

		r.Address = Instance;
		var invoice_no = r.SYPages[q.id_sypage-1].prefix+r.SYPages[q.id_sypage-1].invoice_no_latest;
		return Order.create({
			id_customer 		: r.Customer.id_customer,
			id_sypage 			: q.id_sypage,
			current_state 		: q.current_state,
			id_cart 			: 0,
			id_address_delivery : r.Address.id_address,
			id_address_invoice 	: r.Address.id_address,
			id_carrier			: q.id_carrier,
			secure_key			: md5(helper.passwdGen(9)).toString(),
			reference 			: invoice_no
		}, {transaction: t});
	}).then(function(Instance){

		r.Order = Instance;
		r.SYPages[q.id_sypage-1].invoice_no_latest = r.SYPages[q.id_sypage-1].invoice_no_latest +1;
		return r.SYPages[q.id_sypage-1].save({transaction: t});

	}).then(function(Instance){

		r.SYPage = Instance; 
		return OrderInvoice.create({
			id_order 	: r.Order.id_order,
			number 		: r.Order.id_order,
			delivery_number : 1
		}, {transaction: t});

	}).then(function(Instance){

		r.OrderInvoice = Instance;
		return OrderPayment.create({
			payment_method:'Bank Wire',
			amount:q.amount,
			sy_is_verified:true,
			id_currency:1,
			order_reference:r.Order.reference
		}, {transaction: t});

	}).then(function (Instance) {

		r.OrderPayment = Instance;
		return OrderInvoicePayment.create({
			id_order:r.Order.id_order,
			id_order_invoice:r.OrderInvoice.id_order_invoice,
			id_order_payment:r.OrderPayment.id_order_payment
		}, {transaction: t});

	}).then(function(Instance){

		r.OrderPayment = Instance;
		var tax_multiplier = ((100.00+r.Tax.rate)/100);
		return OrderCarrier.create({
			id_customer 		: r.Customer.id_customer,
			id_order 			: r.Order.id_order,
			id_carrier 			: q.id_carrier,
			firstname 			: q.firstname,
			lastname 			: '',
			shipping_cost_tax_incl : q.shipping_cost_tax_incl, 
			shipping_cost_tax_excl : q.shipping_cost_tax_incl/tax_multiplier,
		}, {transaction: t});

	}).then(function(Instance){

		r.OrderCarrier = Instance;

		var promises = [];
		q.OrderDetails.map((OrderDetail2,index) => {

			var new_promise = 
			 	Product.findOne({
				 	include:[{
				 		model:ProductAttribute,
				 		where:(OrderDetail2.product_attribute_id ? {id_product_attribute:OrderDetail2.product_attribute_id} : null)
				 	},{
			 			model:TaxRulesGroup,
			 			include:[{
			 				model:TaxRule,
			 				include:[{
			 					model:Tax
			 				}]
			 			}]
			 		},{
			 			model:ProductLang
			 		}],
				 	where:{id_product:OrderDetail2.product_id}
			 	});

			promises.push(new_promise);
		});
        return Promise.all(promises);

	}).then(function(Instances){

		r.Products = Instances;

        var promises = [];
        q.OrderDetails.map((OrderDetail2,index) => {

			var Product = r.Products[index];
			var product_price = OrderDetail2.product_price;
			var product_quantity = OrderDetail2.product_quantity;

			var ProductAttribute = Product.ProductAttributes ? Product.ProductAttributes[0] : null;
			var Tax = Product.TaxRulesGroup.TaxRules[0].Tax;
			var tax_multiplier = ((100.00+Tax.rate)/100);

			var price = product_price ? product_price/tax_multiplier : (ProductAttribute ? (Product.price + ProductAttribute.price) : Product.price);
			var wholesale_price = ProductAttribute ? (Product.wholesale_price + ProductAttribute.wholesale_price) : Product.wholesale_price;
			var quantity = product_quantity;

            var new_promise = OrderDetail.create({
				id_order:r.Order.id_order,
				product_id:Product.id_product,
				product_attribute_id:ProductAttribute ? ProductAttribute.id_product_attribute : null,
				product_reference:(ProductAttribute && ProductAttribute.reference) ? ProductAttribute.reference : Product.reference ,
				product_quantity:quantity,
				product_price:price,
				product_name:Product.ProductLangs[0].name,
				product_weight:Product.weight,
				unit_price_tax_excl:price,
				unit_price_tax_incl:price*tax_multiplier,
				total_price_tax_excl:price*quantity,
				total_price_tax_incl:price*tax_multiplier*quantity,
				total_shipping_price_tax_incl:0.00,
				total_shipping_price_tax_excl:0.00,
				purchase_supplier_price:0.00,
				original_product_price:price,
				original_wholesale_price:wholesale_price
            }, {transaction: t});
            promises.push(new_promise);
        });

        return Promise.all(promises);

	}).then(function(Instances){

		r.OrderDetails = Instances;
		var promises = [];
		q.OrderCartRules.map((OrderCartRule2,index) => {

			var new_promise = 
			 	CartRule.findOne({
				 	where:{id_cart_rule:OrderCartRule2.id_cart_rule}
			 	});

			promises.push(new_promise);
		});
        return Promise.all(promises);

	}).then(function(Instances){
		r.CartRules = Instances;

		var tax_multiplier = ((100.00+r.Tax.rate)/100);
		var promises = [];
		q.OrderCartRules.map((OrderCartRule2,index) => {

			var new_promise = 
			 	OrderCartRule.create({
					id_cart_rule:r.CartRules[index].id_cart_rule,
					id_order:r.Order.id_order,
					name:r.CartRules[index].description,
					value:(r.CartRules[index].reduction_tax==1) ? r.CartRules[index].reduction_amount : r.CartRules[index].reduction_amount*tax_multiplier,
					value_tax_excl:(r.CartRules[index].reduction_tax==1) ? r.CartRules[index].reduction_amount/tax_multiplier : r.CartRules[index].reduction_amount,
					free_shipping:r.CartRules[index].free_shipping
			 	});

			promises.push(new_promise);
		});
        return Promise.all(promises);

	}).then(function(Instances){

		r.OrderCartRules = Instances;
		return t.commit();

	}).then(function(){
		
		return Order.scope('admin').findOne({
			include:order_include,
			where:{id_order:r.Order.id_order}
		});

	}).then(function(Instance){

		if(Instance){
			return updateOrderDependencies(Instance);
		}
	}).then(function(Instance){

		r.Order = Instance;
		res.json({success:true,result:r});

	}).catch(function (err) {
		console.log(err);
		res.json({success:false,message:err.message,errors:err.errors});
		return t.rollback();
	});



	});

	res.json(req.body);
});

app.post('/order/create',function(req,res){
	var r={};
	Order.build({
		id_customer 	: req.query.id_customer,
		id_cart 		: 0,
		id_address_delivery : 0,
		id_address_invoice 	: 0,
		id_carrier			: 0,
		current_state 		: 1,
		secure_key			: md5(Math.random()+'').toString(),
		reference 			: helper.passwdGen(9,'NO_NUMERIC')
	}).save()
	.then(function(Instance){
		r.Order = Instance;
		res.send({success:true,Order:r.Order});
	}).catch(function(err){
		console.log(err);
		res.send({success:false,message:'please contact yishu~'});
	});
})

app.post('/order/update/:id',function(req, res){
	const id_order = req.query.id_order;
	const current_state = req.query.current_state;
	const id_sypage = req.query.id_sypage;
	var results = [];

	Sequelize.Promise.all([
		Order.scope('admin').findOne({
			where:{id_order:id_order},
			include:order_include
		})
	]).then(function(answers){
		results = answers;
		if(results && results[0]){
			results[0].current_state = current_state;
			results[0].id_sypage = id_sypage;

			return results[0].save();
		}
	}).then(function(Order){
		if(Order){
			results[0] = Order;
		}
		res.send({success:true,Order:results[0]});
	}).catch(function(err){
		console.log(err);
		res.send({success:false,message:'exception occured'});
	})
})

app.get('/order/get/:id',function(req, res){

	updateOrderDependencies(res.locals.Order)
	.then(function(Instance){
		return Order.scope('admin').findOne({
		    include:order_include,
			where:{id_order:req.params.id}});
	}).then(function(Order){
		res.send({success:true,Order:Order});
	}).catch(function(err){
		console.log(err);
		res.send({success:false,message:'please contact yishu~'});
	});
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
		a.total_paid_tax_incl as total_paid_tax_incl,
		a.total_paid_real as total_paid_real,
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
		d2.reference as products__product_attribute_reference,
		e.firstname as delivery__firstname,
		e.lastname as delivery__lastname,
		e.company as delivery__company,
		e.phone as delivery__phone,
		e.address1 as delivery__address1,
		e.address2 as delivery__address2,
		e.postcode as delivery__postcode,
		e3.name as delivery__state,
		e2.firstname as invoice__firstname,
		e2.lastname as invoice__lastname,
		e2.company as invoice__company,
		e2.phone as invoice__phone,
		e2.address1 as invoice__address1,
		e2.address2 as invoice__address2,
		e2.postcode as invoice__postcode,
		e4.name as invoice__state,
		f.name as sypage_name
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
		LEFT JOIN ps_product_attribute as d2 ON a3.product_attribute_id = d2.id_product_attribute
		LEFT JOIN ps_address as e ON a.id_address_delivery = e.id_address
		LEFT JOIN ps_address as e2 ON a.id_address_invoice = e2.id_address
		LEFT JOIN ps_state as e3 ON e.id_state = e3.id_state
		LEFT JOIN ps_state as e4 ON e2.id_state = e4.id_state		
		LEFT JOIN sy_page as f ON a.id_sypage = f.id_sypage
		WHERE a4l.id_lang=1
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

app.post('/orderdetail/create',function(req,res){

	const id_product = req.query.id_product;
	const id_product_attribute = req.query.id_product_attribute;
	const id_order = req.query.id_order;
	const id_customer = req.query.id_customer;
	const product_quantity = req.query.product_quantity;
	const unit_price_tax_incl = req.query.unit_price_tax_incl;

	 var result = {};
	 Product.scope('admin').findOne({
	 	include:[{
	 		model:ProductAttribute.scope('admin'),
	 		where:(id_product_attribute ? {id_product_attribute:id_product_attribute} : null)
	 	},{
 			model:TaxRulesGroup.scope('admin'),
 			include:[{
 				model:TaxRule.scope('admin'),
 				include:[{
 					model:Tax.scope('admin'),
 					include:[{
 						model:TaxLang.scope('admin')
 					}]
 				}]
 			}]
 		},{
 			model:ProductLang.scope('admin')
 		}],
	 	where:{id_product:id_product}
	 }).then(function(Product){
	 	if(Product){
	 		result['Product'] = Product;
	 	}else{
	 		res.send({success:false,message:'id_product is not found'});
	 	}

		if(id_order){
			return 	Order.scope('admin').findOne({
						where:{id_order:id_order}
					});
		}else if(id_customer && !id_order){
			return Order.build({
				id_customer:id_customer
			}).save();
		}
	}).then(function(Order){

		result['Order'] = Order;
		const Product = result['Product'];
		const ProductAttribute = Product.ProductAttributes ? Product.ProductAttributes[0] : null;
		const Tax = Product.TaxRulesGroup.TaxRules[0].Tax;
		const tax_multiplier = ((100.00+Tax.rate)/100);

		const price = unit_price_tax_incl ? unit_price_tax_incl/tax_multiplier : (ProductAttribute ? (Product.price + ProductAttribute.price) : Product.price);
		const wholesale_price = ProductAttribute ? (Product.wholesale_price + ProductAttribute.wholesale_price) : Product.wholesale_price;
		const quantity = product_quantity;

		return OrderDetail.build({
			id_order:Order.id_order,
			product_id:Product.id_product,
			product_attribute_id:ProductAttribute ? ProductAttribute.id_product_attribute : null,
			product_reference:(ProductAttribute && ProductAttribute.reference) ? ProductAttribute.reference : Product.reference ,
			product_quantity:quantity,
			product_price:price,
			product_name:Product.ProductLangs[0].name,
			product_weight:Product.weight,
			unit_price_tax_excl:price,
			unit_price_tax_incl:price*tax_multiplier,
			total_price_tax_excl:price*quantity,
			total_price_tax_incl:price*tax_multiplier*quantity,
			total_shipping_price_tax_incl:0.00,
			total_shipping_price_tax_excl:0.00,
			purchase_supplier_price:0.00,
			original_product_price:price,
			original_wholesale_price:wholesale_price
		}).save();
	}).then(function(OrderDetailxxx){
		if(OrderDetailxxx){
			result['OrderDetail'] = OrderDetailxxx;

			return Order.scope('admin').findOne({
				include:order_include,
				where:{id_order:req.query.id_order}
			});
		}else{
			res.send({success:false});
		}
	}).then(function(Order){
		if(Order){
			result['Order'] = Order;
			res.send({success:true,Order:result.Order,OrderDetail:result.OrderDetail});
		}else{
			res.send({success:false});
		}
	});

})

app.post('/orderdetail/delete',function(req,res){
	var id_order_detail = req.query.id_order_detail;
	var id_order = req.query.id_order;
	OrderDetail.findOne({where:{id_order_detail:id_order_detail,id_order:id_order}})
	.then(function(OrderDetail){
		if(OrderDetail){
			return OrderDetail.destroy();
		}
	}).then(function(){

		return Order.scope('admin').findOne({
		    include: order_include,
			where:{id_order:id_order}
		});
	}).then(function(Order){
		res.send({success:true,Order:Order});
	});

})

app.post('/address/update',function(req, res){
	var q = {};
	var r = {};
	q.id_address = req.query.id_address;
	//q.id_order = req.query.id_order;
	q.id_customer = req.query.id_customer;
	q.firstname = req.query.firstname;
	q.phone = req.query.phone;
	q.address1 = req.query.address1;
	q.postcode = req.query.postcode;
	q.id_state = req.query.id_state;

	Address.findOne({
		where:{
			id_address:q.id_address,
			id_customer:q.id_customer
		}
	})
	.then(function(Instance){
		r.Address = Instance;
		r.Address.firstname = q.firstname;
		r.Address.phone = q.phone;
		r.Address.address1 = q.address1;
		r.Address.postcode = q.postcode;
		r.Address.id_state = q.id_state;
		return r.Address.save();
	}).then(function(Instance){
		return res.send({success:true,Address:Instance});
	}).catch(function(err){
		console.log(err);
		res.send({success:false,message:'exception occured'});
	})
})

app.post('/address/create',function(req, res){
	var q = {};
	var r = {};
	q.id_order 		= req.query.id_order;
	q.id_customer 	= req.query.id_customer;

	q.id_address 	= req.query.id_address;
	q.firstname = req.query.firstname;
	q.phone 	= req.query.phone;
	q.address1 	= req.query.address1;
	q.postcode 	= req.query.postcode;
	q.id_state 	= req.query.id_state;

	Address.create({
		id_customer 	:q.id_customer,
		firstname 		:q.firstname,
		phone 			:q.phone,
		address1 		:q.address1,
		postcode 		:q.postcode,
		id_state 		:q.id_state,
		id_country 		:136,
		alias 			:'My Address'
	})
	.then(function(Instance){

		r.Address = Instance;
		return Order.findOne({where:{id_order:q.id_order}})
	}).then(function(Instance){

		r.Order = Instance;
		r.Order.id_address_delivery = r.Address.id_address;
		return r.Order.save()
	}).then(function(Instance){

		return res.send({success:true,Address:r.Address});
	}).catch(function(err){

		console.log(err);
		res.send({success:false,message:'exception occured'});
	})
})

app.post('/ordercartrule/create',function(req,res){

	var r = {};
	var q = {};
	q.id_cart_rule = req.query.id_cart_rule;
	q.id_order = req.query.id_order;


		
	Sequelize.Promise.all([
		CartRule.scope('admin').findOne({where:{id_cart_rule:q.id_cart_rule}}),
		Tax.scope('admin').findOne({where:{id_tax:4}})
	]).then(function(Instance){

		r.CartRule = Instance[0];
		r.Tax = Instance[1];
		var tax_multiplier = ((100.00+r.Tax.rate)/100);
		return OrderCartRule.create({
			id_cart_rule:q.id_cart_rule,
			id_order:q.id_order,
			name:r.CartRule.description,
			value:(r.CartRule.reduction_tax==1) ? r.CartRule.reduction_amount : r.CartRule.reduction_amount*tax_multiplier,
			value_tax_excl:(r.CartRule.reduction_tax==1) ? r.CartRule.reduction_amount/tax_multiplier : r.CartRule.reduction_amount,
			free_shipping:r.CartRule.free_shipping
		});
	}).then(function(Instance){

		return OrderCartRule.scope('admin').findAll({
			where:{id_order:q.id_order}
		});
	}).then(function(Instances){

		r.OrderCartRules = Instances;
		res.send({success:true,OrderCartRules:r.OrderCartRules});
	})
})

app.post('/ordercartrule/delete',function(req,res){

	var r = {};
	var q = {};
	q.id_order_cart_rule = req.query.id_order_cart_rule;
	q.id_order = req.query.id_order;
		
	Sequelize.Promise.all([
		Order.scope('admin').findOne({where:{id_order:q.id_order}}),
		OrderCartRule.scope('admin').findOne({where:{id_order_cart_rule:q.id_order_cart_rule}})
	]).then(function(Instance){

		r.Order = Instance[0];
		r.OrderCartRule = Instance[1];

		return r.OrderCartRule.destroy();

	}).then(function(Instance){

		return OrderCartRule.scope('admin').findAll({
			where:{id_order:q.id_order}
		});
	}).then(function(Instances){

		r.OrderCartRules = Instances;
		res.send({success:true,OrderCartRules:r.OrderCartRules});
	})
})

app.post('/ordercarrier/create',function(req,res){

	var r = {};
	var q = {};
	q.id_carrier = req.query.id_carrier;
	q.id_order = req.query.id_order;

	OrderCarrier.create({
		id_carrier:q.id_carrier,
		id_order:q.id_order
	}).then(function(Instance){

		r.OrderCarrier = Instance;
		res.send({success:true,OrderCarrier:r.OrderCarrier});
	})
})

app.post('/ordercarrier/update',function(req,res){

	var r = {};
	var q = {};
	q.id_order_carrier = req.query.id_order_carrier;
	q.id_carrier = req.query.id_carrier;
	q.id_order = req.query.id_order;
	q.tracking_number = req.query.tracking_number;

	OrderCarrier.findOne({
		where:{id_order_carrier:q.id_order_carrier}
	}).then(function(Instance){

		r.OrderCarrier = Instance;
		r.OrderCarrier.id_carrier = q.id_carrier;
		r.OrderCarrier.tracking_number = q.tracking_number;
		return r.OrderCarrier.save();
	}).then(function(Instance){

		r.OrderCarrier = Instance;
		res.send({success:true,OrderCarrier:r.OrderCarrier});
	})
})

app.post('/orderpayment/create',function(req,res){

	var r = {};
	var q = {};
	q.payment_method 	= req.query.payment_method;
	q.amount 			= req.query.amount;
	q.id_order 			= req.query.id_order;
	q.sy_is_verified 	= req.query.sy_is_verified;

	Order.scope('admin').findOne({
		where:{id_order:q.id_order},
		include:OrderInvoice.scope('admin')
	}).then(function(Instance){

		r.Order = Instance;
		if(!r.Order.OrderInvoice){
			return OrderInvoice.create({
			});
		}else{
			return r.Order.OrderInvoice;
		}

	}).then(function(Instance){

		r.OrderInvoice = Instance;
		return OrderPayment.create({
			payment_method:q.payment_method,
			amount:q.amount,
			sy_is_verified:q.sy_is_verified,
			id_currency:1,
			order_reference:r.Order.reference
		})

	}).then(function(Instance){

		r.OrderPayment = Instance;
		return OrderInvoicePayment.create({
			id_order:r.Order.id_order,
			id_order_invoice:r.OrderInvoice.id_order_invoice,
			id_order_payment:r.OrderPayment.id_order_payment
		})
	}).then(function(Instance){
		res.send({success:true,OrderPayments:r.OrderPayments});
	});
})

app.get('/inputpage',function(req,res){
	var id_customer = req.query.id_customer ? req.query.id_customer : null;
	var id_order = req.query.id_order ? req.query.id_order : null;

	var results = {};

	Sequelize.Promise.all([
		ProductAttribute.scope('admin').findAll({
			include:product_attribute_admin_include
		}),
		OrderState.scope('admin').findAll({
			include:[{
				model:OrderStateLang.scope('admin'),
				where:{id_lang:1}
			}]
		}),
		SYPage.scope('admin').findAll(),
		Tax.scope('admin').findOne({where:{id_tax:4}}),
  		Product.scope('admin').findAll({
  			include:[{
  				model:ProductAttribute.scope('admin'),
  				include:[{
  					model:SpecificPrice.scope('admin'),
  				}]
  			},{
  				model:SpecificPrice.scope('admin')
  			}]
  		}),
  		Country.scope('admin').findOne({
  			include:[{
  				model:State.scope('admin')
  			}],
  			where:{id_country:136}
  		}),
  		CartRule.scope('admin').findAll()
		/*
		sequelize.query(
		`	SELECT 	Product.id_product,
					ProductAttribute.id_product_attribute,
					Product.reference AS reference_p,
					ProductAttribute.reference AS reference_pa 
			FROM ps_product as Product
			LEFT JOIN ps_product_attribute as ProductAttribute ON ProductAttribute.id_product = Product.id_product 
			WHERE 1`,
  		{ type: sequelize.QueryTypes.SELECT })*/

	]).then(function(answers){
		results['ProductAttributes'] = answers[0];
		results['OrderStates'] = answers[1];
		results['SYPages'] = answers[2];
		results['Tax'] = answers[3];
		//results['product_references'] = answers[4];
		results['Products'] = answers[4];
		results['Country'] = answers[5];
		results['CartRules'] = answers[6];

		if(id_customer && !id_order){
			return Customer.scope('admin').findOne({where:{id_customer:id_customer}});
		}else if(id_customer && id_order){
			return Customer.scope('admin').findOne({
				where:{id_customer:id_customer},
				include:[{
					model:Order.scope('admin'),
					foreignKey:'id_customer',
					as:'Orders'
				}]
			});
		}else{
			return Sequelize.Promise.resolve(null);
		}
	}).then(function(Customer) {
		if(Customer){
			results['Customer'] = Customer;
			res.render('inputpage',{data:results});
		}else{
			res.render('inputpage',{data:results});
		}
	});

})

app.get('/fastpage',function(req,res){

	var results = {};
	Sequelize.Promise.all([
		ProductAttribute.scope('admin').findAll({
			include:product_attribute_admin_include
		}),
		OrderState.scope('admin').findAll({
			include:[{
				model:OrderStateLang.scope('admin'),
				where:{id_lang:1}
			}]
		}),
		SYPage.scope('admin').findAll(),
		Tax.scope('admin').findOne({where:{id_tax:4}}),
  		Product.scope('admin').findAll({
  			include:[{
  				model:ProductAttribute.scope('admin'),
  				include:[{
  					model:SpecificPrice.scope('admin'),
  				}]
  			},{
  				model:SpecificPrice.scope('admin')
  			}]
  		}),
  		Country.scope('admin').findOne({
  			include:[{
  				model:State.scope('admin')
  			}],
  			where:{id_country:136}
  		}),
  		CartRule.scope('admin').findAll(),
  		Carrier.scope('admin').findAll()


	]).then(function(answers){
		results['ProductAttributes'] = answers[0];
		results['OrderStates'] = answers[1];
		results['SYPages'] = answers[2];
		results['Tax'] = answers[3];
		//results['product_references'] = answers[4];
		results['Products'] = answers[4];
		results['Country'] = answers[5];
		results['CartRules'] = answers[6];
		results['Carriers'] = answers[7];

		return null;
	}).then(function(Instance) {
		res.render('fastpage',{data:results});
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

app.post('/customer/create',function(req,res){

	var q = {};
	q.firstname 	= req.query.firstname;
	q.lastname 		= (req.query.lastname ? req.query.lastname : '');
	q.email 		= req.query.email;
	q.passwd 		= req.query.passwd;
	q.group 		= req.query.group;
	q.fbuser_name 	= req.query.fbuser_name;
	q.fbuser_id 	= req.query.fbuser_id ? req.query.fbuser_id : '1';

	var r = {};

	Customer.create({

		firstname 	: q.firstname,
		lastname 	: q.lastname,
		email 		: q.email,
		passwd 		: (q.passwd ? md5(_COOKIE_KEY_+q.passwd).toString() : 'e1767dc27c8a1f673cd5d8e5fa2387cb'),
		secure_key 	: md5(Math.random()+'').toString(),
		id_default_group : q.group === 'AGENT' ? 4 : 3,
		sy_fbuser_name : q.fbuser_name
	}).then(function(Instance){

		r.Customer = Instance;
		if(q.group === 'CUSTOMER'){
			return CustomerGroup.build({
				id_customer 	: r.Customer.id_customer,
				id_group 		: 3
			}).save();
		}else if(q.group === 'AGENT'){
			return CustomerGroup.build({
				id_customer 	: r.Customer.id_customer,
				id_group 		: 4
			}).save();
		}

	})
	.then(function(Instance){

		r.CustomerGroup = Instance;
		return Customer.scope('admin').findOne({
			where:{id_customer : r.Customer.id_customer},
			include:[{
				model : Order.scope('admin')
			}]
		})
	})
	.then(function(Instance){
		r.Customer = Instance;
		res.send({success:true,Customer:r.Customer});
	})
	.catch(Sequelize.ValidationError, function(error){
		res.send({success:false,errors:error.errors});
	});
})

app.get('/customer/get/:id',function(req,res){
	var q = {}
	if(!req.params.id){
		return false;
	}else{
		q.id_customer = req.params.id;
	}

	Customer.scope('admin').findOne({
		where:{id_customer:q.id_customer},
		include:[{
			model:Order.scope('admin')
		}]
	}).then(function(Instance){
		res.send({success:true,Customer:Instance});
	})
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
			    include: order_include,
				where:{id_order:req.params.id}

			}).then(function(row){
				result.push(row);
				return OrderPayment.scope('admin').findAll({where:{order_reference:row.reference}});
			}).then(function(rows){
				result[0].setDataValue('OrderPayment',rows);
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
		case 'product':
			Product.scope('admin').findAll({
				include:[{
					model:ProductAttribute.scope('admin')
				},{
					model:ProductLang.scope('admin'),
					where:{id_lang:1}
				}]
			}).then(function(Products){
				res.send({success:true,Products:Products});
			})
			break;
		case 'product_attribute':
			ProductAttribute.scope('admin').findAll({
				include:[{
					model:Product.scope('admin'),
					include:[{
						model:ProductLang.scope('admin'),
						where:{id_lang:1}
					}]
				}]
			}).then(function(ProductAttributes){
				res.send({success:true,ProductAttributes:ProductAttributes});
			})
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

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

