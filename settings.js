var settings = {
	//base_dir:'/api'+((parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) ? (parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) : ''),		// /api
	base_dir:(process.env.BASE_DIR ? process.env.BASE_DIR : '/api'),
	db_host:'localhost',	//localhost
	db_name:'sycommy_shop', //sycommy_shop
	db_user:'sycommy_shop',	//root/sycommy_shop
	db_passwd:'Malaysiaboleh2014',//1234/Malaysiaboleh2014
	_COOKIE_KEY_:'0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb:{
		app_id:'610601409139399', //610612705804936/610601409139399
		app_secret:'b2dc0e4b7dd44436614eb4d72381e150', //cf682be6c2942e8af05c7a5ea13ce065/b2dc0e4b7dd44436614eb4d72381e150
		base_url:'https://www.facebook.com/',
		graph_api_url:'https://graph.facebook.com/v2.8'
	}
}

module.exports.settings = settings;
/*
var settings = {
	base_dir:'',		// /api
	db_host:'localhost',	//localhost
	db_name:'sycommy_shop', //sycommy_shop
	db_user:'root',	//sycommy_shop
	db_passwd:'1234',//Malaysiaboleh2014
	_COOKIE_KEY_:'0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb:{
		app_id:'610612705804936', //610601409139399
		app_secret:'cf682be6c2942e8af05c7a5ea13ce065', //b2dc0e4b7dd44436614eb4d72381e150
		base_url:'https://www.facebook.com/',
		graph_api_url:'https://graph.facebook.com/v2.8'
	}
}

var settings = {
	base_dir:'/api'+((parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) ? (parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) : ''),		// /api
	db_host:'localhost',	//localhost
	db_name:'sycommy_shop', //sycommy_shop
	db_user:'sycommy_shop',	//root/sycommy_shop
	db_passwd:'Malaysiaboleh2014',//1234/Malaysiaboleh2014
	_COOKIE_KEY_:'0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb:{
		app_id:'610601409139399', //610612705804936/610601409139399
		app_secret:'b2dc0e4b7dd44436614eb4d72381e150', //cf682be6c2942e8af05c7a5ea13ce065/b2dc0e4b7dd44436614eb4d72381e150
		base_url:'https://www.facebook.com/',
		graph_api_url:'https://graph.facebook.com/v2.8'
	}
}
*/