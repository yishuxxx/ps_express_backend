var settings = {
	//base_dir:'/api'+((parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) ? (parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) : ''),		// /api
	SERVER_URL:'https://www.sy.com.my',
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
//daigou
//-MAINAPP/EAAIrVrgXUscBAHNRh9lOJCRWXkZCpJsoP8m1EBxVqZA8ZAc96LdYn3y5Xn9AQ6QgCN5IM5wjwtpZAFZBMOYxUw3rdSZBfp9qoQZAj0lcCI7TwxDyFfYUiedkcElCaPO8IGZBOCZBpGYAFisskiAEE9nsQkeoRMnqTjdzupZCCMM8Y4rQZDZD
//-TESTAPP/EAAIrWVlswogBADzmkKyItbSX4WsQQZBhVcHXcocwCapgLZAZCIAm6jlTcJE3Ay0cVBxpjZAs2CMfWf1mMcgXRfxrUaN8ai5JYz6VKU769qZBnS5SLZBNUki31bm2rxWZBOfZCGUT6UPXZBZAEULve2U67n4vbbt5E4kEw3P6kT0mx27gZDZD
//sy
//-MAINAPP/EAAIrVrgXUscBAJkgBFbqgDpCK5WnXLZAFlZCnw9EGL1N9JX7lNqLXg2LkXR3kpBDg2XDIZCxWLBDiLpxsqcY249mZCw8cAKSHrA0YYOJOuZCbLKtCOpoXG31NlDyK00QJUqUZBXd4ZCoOZA1ZBl6gb01sfPLgamVsMPaWGrl7Re91tAZDZD
//-TESTAPP/EAAIrWVlswogBAADr44gqWln13t7UWeThlkRtvHaZCl5KO7H8K9f4ZBAykQVsZCinvdKZCxm0yqpkJf7tM77qud4sk3WlZBjLrQySBIzkDaZBWh30tpnmyskZCKGgUYFa52ZAFhHFUC3oedZAy12ItVU4WMxS4IZBVeYlIeHf38YPIN9wZDZD
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