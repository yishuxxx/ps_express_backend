module.exports = function Msg(express, request, rq, crypto, settings, Sequelize, sequelize, io, winston) {
let router = express.Router();
let moment = require('moment');
let {randomString,unique2DArray} = require('../src/Utils/Helper');
let {FBGraphAPIStandardError, FBGraphAPIError, FBGraphAPINoResultError, SequelizeError, SequelizeNoResultError} = require('../src/Utils/Error');
var fs = require('fs');
var Promise = Sequelize.Promise;

this.router = router;

// middleware that is specific to this router
/*
router.use('/',function (req, res, next) {
	console.log('Time: ', Date.now())
	next()
});
*/
const BASEDIR_IMAGE = './data/image/';
const APP_SECRET = 'b2dc0e4b7dd44436614eb4d72381e150';//b2dc0e4b7dd44436614eb4d72381e150//cf682be6c2942e8af05c7a5ea13ce065
// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = 'TheOneAndOnlyToken';
const SERVER_URL = 'https://www.sy.com.my/api/msg/';
/*
if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
	console.error('Missing config values');
	process.exit(1);
}
*/

let {EmployeeFunc} = require('../src/models/employee');
let Employee = EmployeeFunc(Sequelize, sequelize);

let {FBMessageFunc} = require('../src/models/FBMessage');
let FBMessage = FBMessageFunc(Sequelize, sequelize);
let {FBMessageAttachmentFunc} = require('../src/models/FBMessageAttachment');
let FBMessageAttachment = FBMessageAttachmentFunc(Sequelize, sequelize);
let {FBAttachmentFunc} = require('../src/models/FBAttachment');
let FBAttachment = FBAttachmentFunc(Sequelize, sequelize);

let {FBCommentFunc} = require('../src/models/FBComment');
let FBComment = FBCommentFunc(Sequelize, sequelize);
let {FBConversationFunc} = require('../src/models/FBConversation');
let FBConversation = FBConversationFunc(Sequelize, sequelize);
let {FBPageFunc} = require('../src/models/FBPage');
let FBPage = FBPageFunc(Sequelize, sequelize);
let {FBLabelFunc} = require('../src/models/FBLabel');
let FBLabel = FBLabelFunc(Sequelize, sequelize);
let {FBConversationLabelFunc} = require('../src/models/FBConversationLabel');
let FBConversationLabel = FBConversationLabelFunc(Sequelize, sequelize);
let {FBUploadFunc} = require('../src/models/FBUpload');
let FBUpload = FBUploadFunc(Sequelize, sequelize);
let {FBSReplyFunc} = require('../src/models/FBSReply');
let FBSReply = FBSReplyFunc(Sequelize, sequelize);

let {FBXTagFunc} = require('../src/models/FBXTag');
let FBXTag = FBXTagFunc(Sequelize, sequelize);
let {FBXUploadTagFunc} = require('../src/models/FBXUploadTag');
let FBXUploadTag = FBXUploadTagFunc(Sequelize, sequelize);

let {ProductFunc} = require('../src/models/product');
let Product = ProductFunc(Sequelize, sequelize);
let {FBConversationProductFunc} = require('../src/models/FBConversationProduct');
let FBConversationProduct = FBConversationProductFunc(Sequelize, sequelize);


FBConversation.hasMany(FBMessage, {foreignKey:'t_mid'});
FBMessage.belongsTo(FBConversation, {foreignKey:'t_mid'});
//FBMessage.hasMany(FBAttachment, {foreignKey:'m_mid'});
FBMessage.belongsTo(Employee, {foreignKey:'id_employee'});
//FBAttachment.belongsTo(FBMessage, {foreignKey:'m_mid'});
FBLabel.belongsToMany(FBConversation, {through:FBConversationLabel, foreignKey:'label_id', otherKey:'t_mid'});
FBConversation.belongsToMany(FBLabel, {through:FBConversationLabel, foreignKey:'t_mid', otherKey:'label_id'});

FBMessage.belongsToMany(FBAttachment, {through:FBMessageAttachment, foreignKey:'m_mid', otherKey:'attachment_id'});
FBAttachment.belongsToMany(FBMessage, {through:FBMessageAttachment, foreignKey:'attachment_id', otherKey:'m_mid'});

FBUpload.belongsToMany(FBXTag, {through:FBXUploadTag, foreignKey:'upload_id', otherKey:'tag_id'});
FBXTag.belongsToMany(FBUpload, {through:FBXUploadTag, foreignKey:'tag_id', otherKey:'upload_id'});

FBConversation.belongsToMany(Product, {through:FBConversationProduct, foreignKey:'t_mid', otherKey: 'id_product'});
Product.belongsToMany(FBConversation, {through:FBConversationProduct, foreignKey:'id_product', otherKey: 't_mid'});

let PAGE_ACCESS_TOKEN_LONG;
let PAGE_ACCESS_TOKEN_MESSENGER;
let initialize = function() {
	return FBPage.findAll()
	.then(function(FBPages) {
		let list = {};
		let list2 = {};
		if(FBPages && FBPages.length >= 1) {
			FBPages.map(function(FBPage, i) {
				list[FBPage.pid] = FBPage.access_token_long;
				list2[FBPage.pid] = FBPage.access_token_messenger;
			});
		}
		PAGE_ACCESS_TOKEN_LONG = list;
		PAGE_ACCESS_TOKEN_MESSENGER = list2;
	});
};
initialize();
let READINGS = [];

let numUsers = 0;
//io.set('transports', ['websocket']);
io.on('connection', function(socket) {
	console.log('connected to socket client');
	console.log('socket_id='+socket.id);
	console.log(socket.request.user);
	socket.emit('GET_ME',socket.request.user);

	socket.on('GET_EMPLOYEES', function(q) {
		console.log('======================== socket.on(GET_EMPLOYEES) =========================');

		return Employee.scope('messenger').findAll()
		.then(x=>sequelizeHandler(x,q,'No Employees found'))
		.then(function(Instances){
			console.log('======================== socket.emit(GET_EMPLOYEES) =========================');
			socket.emit('GET_EMPLOYEES', {
				Employees:Instances
			});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_UPLOADS', function(data) {
		console.log('======================== socket.on(GET_UPLOADS) =========================');
		var q = {pid:data.pid};

		return FBUpload.findAll({
			where:{pid:q.pid},
			include:[{
				model:FBXTag
			}]
		}).then(x=>sequelizeHandler(x,q,'FBUploads for this page NOT FOUND'))
		.then(function(Instances){
			console.log('======================== socket.emit(GET_EMPLOYEES) =========================');
			socket.emit('ADD_FILES', {
				pid:q.pid,
				FBUploads:Instances
			});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_LABELS', function(data) {
		console.log('======================== socket.on(GET_LABELS) START =========================');
		var q = {pid:data.pid};

		return FBLabel.findAll({
			where:{pid:q.pid}
		}).then(x=>sequelizeHandler(x,q,'No Labels found for this page'))
		.then(function(Instances){
			console.log('======================== socket.on(GET_LABELS) END =========================');
			socket.emit('GET_LABELS', {
				data:Instances,
				pid:q.pid
			});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_READINGS',function(data) {
		socket.emit('GET_READINGS',READINGS);
	});

	socket.on('ADD_READING',function(data) {
		var read = {t_mid:data.t_mid,id_employee:data.id_employee,socket_id:socket.id};
		READINGS = deleteReadings(READINGS,read.id_employee);		
		READINGS.push(read);
		socket.broadcast.emit('ADD_READING',read);
	});

	/*
	socket.on('DELETE_READINGS',function(data) {
		var read = {t_mid:data.t_mid,id_employee:data.id_employee,socket_id:socket.id};
		READINGS = deleteReadings(READINGS,read.id_employee,read.socket_id,read.t_mid);
		socket.broadcast.emit('DELETE_READINGS',read);
	});
	*/

	socket.on('CONVERSATION_PRODUCT', function(data) {
		console.log('======================== socket.on(CONVERSATION_PRODUCT) =========================');

		var q = {
			crud:data.crud,
			pid:data.pid,
			t_mid:data.t_mid,
			id_product:data.id_product
		};
		var r = {};

		new Promise(function(resolve,reject){
			if(q.crud === 'CREATE'){
				resolve(createConversationProduct(q.t_mid,q.id_product,undefined,undefined,socket.request.user.id_employee));
			}else if(q.crud === 'DELETE'){
				resolve(deleteConversationProduct(q.t_mid,q.id_product));
			}else{
				throw new Error(JSON.stringify({q:q,message:'crud operation does not exist'}));
			}
		}).then(function(Instance){
			return findOneConversation(q.t_mid);
		}).then(function(Instance){
			r.FBConversation = Instance;
			io.local.emit('NEW_MESSAGE',{
				pid:q.pid,
				t_mid:q.t_mid,
				Conversation:r.FBConversation
			});
		}).catch(function(err){
			catchHandler(err,null,socket);
			if(err instanceof Error){
				socket.emit('CONVERSATION_PRODUCT',{
					error:err.name,
					message:err.message
				});
			}
		});
	});

	socket.on('GET_PRODUCTS', function(data) {
		var r = {};
		findAllProduct()
		.then(function(Instances){
			r.Products = Instances;
			socket.emit('GET_PRODUCTS',{
				Products:r.Products
			});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('UPDATE_CONVERSATION_LABELS', function(data) {
		console.log('======================== socket.on(UPDATE_CONVERSATION_LABELS) =========================');

		var r = {
			pid:data.pid,
			t_mid:data.t_mid,
			labels:data.labels
		};
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[r.pid];

		findOneConversation(r.t_mid)
		.then(function(Instance){
			r.FBConversation = Instance;
			if(r.FBConversation.FBLabels && r.FBConversation.FBLabels.length >= 1){
				r.FBConversationLabels = r.FBConversation.FBLabels;
				var promises = [];
				r.FBConversationLabels.map((ConversationLabel,i)=>{
					var index = r.labels.findIndex((x,i)=>(parseInt(x.value,10) === parseInt(ConversationLabel.label_id,10)));
					if(index === -1){
						promises.push(
							destroyConversationLabel(r.t_mid,ConversationLabel.label_id)
						);
						promises.push(
							deletePageLabel(PAGE_ACCESS_TOKEN,r.FBConversation.uid,ConversationLabel.label_id)
						);
					}
				});
				return Promise.all(promises);					
			}
		}).then(function(promise_all_result){
			var promises = [];
			r.labels.map((label,i)=>{
				if(r.FBConversationLabels && r.FBConversationLabels.length >=1){
					var index = r.FBConversationLabels.findIndex((x,i)=>(parseInt(x.label_id,10) === parseInt(label.value,10)));
				}else{
					var index = -1;
				}
				if(index === -1){
					promises.push(
						FBConversationLabel.create({
							t_mid_label_id:r.t_mid+'_'+label.value,
							t_mid:r.t_mid,
							label_id:label.value
						}).then(x=>sequelizeHandler(x,{t_mid:r.t_mid,label_id:label.value},'FBConversationLabel.create returned no results'))
					);

					promises.push(postPageLabel(PAGE_ACCESS_TOKEN,r.FBConversation.uid,label.value));
				}
			});
			return Promise.all(promises);

		}).then(function(promise_all_result){
			return findOneConversation(r.t_mid);
		}).then(function(Conversation){
			io.local.emit('NEW_MESSAGE', {
				Conversation:Conversation,
				pid:r.pid
			});
			console.log('======================== socket.on(UPDATE_CONVERSATION_LABELS) END =========================');
		}).catch(err=>catchHandler(err,null,socket));
		
	});

	socket.on('SYNC_LABELS', function(data) {
		var pid = data.pid;

		syncLabels(PAGE_ACCESS_TOKEN_LONG[pid], pid)
		.then(function(nested){
			socket.emit('SYNC_LABELS',{success:true,length:nested.length});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('ENGAGE_CONVERSATION', function(data) {
		console.log('======================== socket.on(ENGAGE_CONVERSATION) =========================');		
		var q = {
			pid:data.pid,
			t_mid:data.t_mid,
			id_employee:socket.request.user.id_employee,
			firstname:socket.request.user.firstname
		};
		var r = {};

		return FBConversation.findOne({
			where: {t_mid: q.t_mid},
		}).then(x=>sequelizeHandler(x,{t_mid:t_mid},'FBConversation.findOne return no results'))
		.then(function(Instance) {
			r.FBConversation = Instance;
			r.psid = r.FBConversation.psid ? r.FBConversation.psid : undefined;
			r.FBConversation.engage_by = q.id_employee;
			r.FBConversation.engage_time = moment().utcOffset(0).format('YYYY-MM-DD HH:mm:ss');
			r.FBConversation.engage_release = 0;
			return r.FBConversation.save()
			.then(x=>sequelizeHandler(x,{t_mid:t_mid},'FBConversation.save return no results'));
		}).then(function(Instance){
			var message_data = {
				recipient: {
					id: r.psid,
				},
				message: {
					text: '[客服人员进入] 你好~ 我是 '+q.firstname+' 很高兴为你服务',
					metadata: 'DEVELOPER_DEFINED_METADATA',
				},
			};

			return callSendAPI(message_data,'text',{
				pid:q.pid,
				t_mid:q.t_mid,
				psid:(r.psid ? r.psid : undefined),
				id_employee:q.id_employee
			});
		}).then(function(r2){
			io.local.emit('NEW_MESSAGE', {
				pid:q.pid,
				Conversation:r2.FBConversation,
				Message:r2.FBMessage
			});
			console.log('======================== socket.on(NEW_MESSAGE) END =========================');
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('DELETE_ENGAGES', function(data) {
		console.log('======================== socket.on(DELETE_ENGAGES) =========================');		
		var q = {
			id_employee:data.id_employee
		};
		var r = {};

		console.log('======================== FBConversation.findAll =========================');		
		return FBConversation.findAll({
			where: {engage_by: q.id_employee},
		}).then(x=>sequelizeHandler(x,{engage_by:q.id_employee},'FBConversation.findAll returned no results'))
		.then(function(Instances){
			console.log('======================== FBConversation.save x N =========================');		
			r.FBConversations = Instances;
			return Promise.mapSeries(r.FBConversations,function(FBConversation,i){
				FBConversation.engage_release = 1;
				return FBConversation.save()
				.then(x=>sequelizeHandler(x,{t_mid:FBConversation.t_mid},'FBConversation.save'));
			});
		}).then(function(unknown){
			io.local.emit('DELETE_ENGAGES', {
				Conversations:r.FBConversations,
			});
			console.log('======================== socket.emit(DELETE_ENGAGES) =========================');
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('SYNC_CONVERSATIONS',function(data){

		let pid = data.pid;
		let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
		let last_message_date = moment(data.last_message_date);
		let result = {};

		var count_conv = 0;
		var count_msg = 0;

		new Promise(function(resolve, reject) {
			let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
			let qs = {
				access_token: PAGE_ACCESS_TOKEN,
				fields: 'link,id,message_count,snippet,updated_time,unread_count,participants,messages.limit(1){from}',
				limit: 100,
			};

			// start first iteration of the loop
			nextFBRequest(resolve, reject, {uri: uri, qs: qs}, {data: []}, function(r, response) {
				let list = response.data;
				list.map((item, i)=>{
					let tmp = last_message_date.diff(moment(item.updated_time), 'seconds');
					i === 0 ? console.log(item.updated_time+'___'+tmp + '___' + (tmp >= 0)) : null;
					if(last_message_date.diff(moment(item.updated_time), 'seconds') >= 0) {
						r.continue = false;
					}
				});
				result = r;
				return r;
			});
		}).then(function(r) {
			return Promise.mapSeries(r.data,function(Conversation){
				return FBConversation.upsert({
						pid: Conversation.participants.data[1].id,
						uid: Conversation.participants.data[0].id,
						pid_uid: Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id,
						t_mid: Conversation.id,
						psid: undefined,
						updated_time: Conversation.updated_time,
						link: Conversation.link,
						name: Conversation.participants.data[0].name,
						snippet:	Conversation.snippet,
						message_count: Conversation.message_count,
						unread_count: Conversation.unread_count,
						customer_replied:Conversation.messages.data[0].from.id === Conversation.participants.data[0].id,
						customer_replied_time:(Conversation.messages.data[0].from.id === Conversation.participants.data[0].id ? Conversation.updated_time : undefined)
					}, {
						where: {
							t_mid: Conversation.id,
						},
					}
				)
			});
		}).then(function(is_inserts){
			socket.emit('SYNC_CONVERSATIONS',{success: true});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_CONVERSATIONS', function(data) {
		console.log('======================== socket.on(GET_CONVERSATIONS) =========================');
		var q = {
			pid:data.pid,
			before:typeof data.before !== 'undefined' ? moment.utc(data.before).format("YYYY-MM-DD HH:mm:ss") : moment.utc().format("YYYY-MM-DD HH:mm:ss"),
			limit:typeof data.limit !== 'undefined' ? data.limit : 100,
			inbox:typeof data.inbox !== 'undefined' ? data.inbox : undefined,			
			engage_by:typeof data.engage_by !== 'undefined' ? data.engage_by : undefined,
			label_ids:typeof data.label_ids !== 'undefined' ? data.label_ids : undefined,
			name:typeof data.name !== 'undefined' ? data.name : undefined,
			message:typeof data.message !== 'undefined' ? data.message : undefined,
		};
		var r = {};

		var condition = {
			where:{pid:q.pid},
			order:[['updated_time','DESC']]
		};
		var include = [];
		/*
		if(q.before){
			condition.where.updated_time = {$lt:q.before};
		}
		*/
		if(q.inbox && q.inbox === 'UNREAD'){
			//condition.where.unread_count = {$gt:0};
			condition.where.customer_replied = 1;
		}
		if(q.label_ids && q.label_ids.length >=1){
			/*
			var where_labels = {};
			where_labels.label_id = {$in:q.label_ids};
			*/
			include.push({
				model:FBLabel,
				where:{
					label_id:{$in:q.label_ids}
				}
			});
		}
		if(q.engage_by){
			condition.where.replied_last_by = q.engage_by;
		}
		if(q.name){
			condition.where.name = {$like:'%'+q.name+'%'};
		}
		if(include && include.length >=1){
			condition.include = include;
		}

		console.log(condition);

		new Promise(function(resolve,reject){
			if(!q.inbox && !q.label_ids && !q.engage_by && !q.name && !q.message){
				resolve('NO_FILTER');
			}else{
				return FBConversation.findAll(condition)
				.then(x=>sequelizeHandler(x,{q:q},'Conversation you search for is not found'))
				.then(function(Instances){
					var t_mids = Instances.map((FBConversation,i)=>(FBConversation.t_mid));
					resolve(t_mids);

					if(q.message){
						return FBMessage.findAll({
							attributes:['t_mid'],
							where:{message:{$like:'%'+q.message+'%'},t_mid:{$in:t_mids}}
						}).then(x=>sequelizeHandler(x,{q:q},'Conversation you search for is not found'))
						.then(function(Instances){
							t_mids = Instances.map((FBMessage,i)=>(FBMessage.t_mid));
							resolve(t_mids);
						}).catch(function(err){
							reject(err);
						});
					}
				}).catch(function(err){
					reject(err);
				});
			}
		}).then(function(t_mids){
			if((t_mids instanceof Array) && t_mids.length >=1){
				var where = {t_mid:{$in:t_mids}};
				if(q.before){
					where.updated_time = {$lt:q.before};
				}
			}else if(t_mids === 'NO_FILTER'){
				var where = {pid:q.pid,updated_time:{$lt:q.before}};
			}

			return FBConversation.findAll({
				where:where,
				include:[{
					model:FBLabel
				},{
					model:Product,
					attributes:['id_product','reference']
				}],
				limit:q.limit,
				order:[['updated_time','DESC']],
			}).then(x=>sequelizeHandler(x,{where:where},'FBConversation.findAll'));
		}).then(function(Instances){
			r.FBConversations = Instances;
			r.FBConversations.map((FBConversation,i)=>{
				r.FBConversations[i] = r.FBConversations[i].get({plain:true});
				if(r.FBConversations[i].messages){
					r.FBConversations[i].FBMessages = undefined;
					r.FBConversations[i].messages = {data:r.FBConversations[i].messages.data.slice(0,25)};
				}
			});
			socket.emit('GET_CONVERSATIONS', {
				pid:q.pid,
				filter:q,
				Conversations:r.FBConversations
			});
		}).catch(function(err){
			catchHandler(err,null,socket);
			if(err instanceof SequelizeNoResultError){
				socket.emit('GET_CONVERSATIONS', {
					error:err.name,
					message:'No Conversations matches the filter'
				});
			}
		});
	});

	socket.on('GET_MESSAGES',function(data){
		console.log('======================== socket.on(GET_MESSAGES) =========================');		
		var q = {
			pid:data.pid,
			t_mid:data.t_mid,
			latest_only:data.latest_only
		}
		var r = {};

		console.log('======================== 1 findAllMessages =========================');
		new Promise(function(resolve, reject) {
			if(q.latest_only === true){
				findAllMessages(q.t_mid,{limit:25})
				.then(function(Instances){
					r.FBMessages = Instances;
					socket.emit('GET_MESSAGES', {
						pid:q.pid,
						Messages:r.FBMessages
					});
					resolve();
				});
			}else{
				resolve();
			}
		}).then(function(Instances){
			console.log('======================== 2 getAndUpsertConversation =========================');
			return getAndUpsertConversation(PAGE_ACCESS_TOKEN_LONG[q.pid],q.t_mid);
		}).then(function(result){
			console.log('======================== 2 getAndUpsertMessages =========================');
			if(result){
				r.FBConversation = result.FBConversation;
				return getAndUpsertMessages(PAGE_ACCESS_TOKEN_LONG[q.pid],q.pid,q.t_mid,{total_count:(q.latest_only ? 99 : null) });
			}
		}).then(function(result){
			if(result && result.FBMessages && result.FBMessages.length>=1){
				console.log('======================== 3 socket.emit(GET_MESSAGES) =========================');
				r.FBMessages = result.FBMessages;
				socket.emit('GET_MESSAGES', {
					pid:q.pid,
					Conversation:r.FBConversation,
					Messages:r.FBMessages
				});
			}else{
				socket.emit('ERROR', {
					error:'No More Messages',
					message:'No more messages to retreieve'
				});
			}
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('REFRESH_CONVERSATIONS', function(data){
		console.log('======================== socket.on(REFRESH_CONVERSATIONS) START =========================');

		var q = {pid:data.pid};
		var r = {};
		/*
		p[0] = sequelize.query(
			`SELECT 
				COUNT(fb_message.id) as message_count_db,
				fb_conversation.t_mid as t_mid,
				fb_conversation.updated_time as updated_time
			FROM fb_conversation 
			JOIN fb_message ON fb_message.t_mid=fb_conversation.t_mid
			WHERE pid=:pid 
			GROUP BY fb_conversation.id
			ORDER BY fb_conversation.updated_time DESC
			LIMIT 100`,
		  { replacements: { pid: pid }, type: sequelize.QueryTypes.SELECT }
		);*/
		var p = [];

		console.log('======================== 1 FBConversation.findAll && getConversations =========================');		
		p[0] = FBConversation.findAll({
			where:{pid:q.pid},
			order:[['updated_time','DESC']],
			limit:100
		});

		p[1] = getConversations(PAGE_ACCESS_TOKEN_LONG[q.pid],q.pid,{limit:100,fields:'message_count,link,id,participants,snippet,unread_count,updated_time,messages.limit(1){id,from,message,created_time,attachments.limit(100){id,image_data,mime_type,name,size,video_data,file_url},to}'});
		
		Promise.all(p)
		.spread(function(Instances,Conversations_){
			if(Instances && Conversations_){
				console.log('======================== 2 find ConversationsToUpdate =========================');		
				var FBConversations = Instances;			
				var Conversations = Conversations_;
				var ConversationsToUpdate = [];
				var p = [];

				Conversations.map((Conversation,i)=>{
					var FBConversation = FBConversations.find((x,i)=>(x.t_mid === Conversation.id));
					if(FBConversation){
						var time_diff = moment(Conversation.updated_time).diff(moment(FBConversation.updated_time));
						if(time_diff > 0){
							Conversation.t_mid = Conversation.id;
							ConversationsToUpdate.push(Conversation);
						}else if(time_diff === 0){
							//DO NOTHING
						}else{
							throw new Error(JSON.stringify({message:'time_diff is negative',data:data}));
						}
					}else{
						Conversation.t_mid = Conversation.id;
						ConversationsToUpdate.push(Conversation);
					}
				});

				console.log('======================== 3 upsertConversation * N =========================');		
				ConversationsToUpdate.map((Conversation,i)=>{
					p.push(upsertConversation(Conversation));
				});
				r.Conversations = ConversationsToUpdate;

				return Promise.all(p);
			}else{
				throw new SequelizeNoResultError(JSON.stringify({data:data}));
			}
		}).then(function(unknown){
			console.log(unknown);
			console.log('======================== 4* socket.emit(REFRESH_CONVERSATIONS) =========================');
			console.log(r.Conversations.length);
			socket.emit('REFRESH_CONVERSATIONS',{
				pid:q.pid,
				Conversations:r.Conversations
			});
		}).catch(err=>catchHandler(err,null,socket));
	});

	let addedUser = false;
	// when the client emits 'NEW_MESSAGE', this listens and executes
	socket.on('NEW_MESSAGE', function(data) {
		console.log('======================== socket.on(NEW_MESSAGE) START =========================');
		console.log('EMPLOYEE='+socket.request.user.email);

		var r = data;

		return FBConversation.findOne({
			where: {t_mid: r.t_mid},
		}).then(sequelizeHandler)
		.then(function(Instance) {
			if(Instance) {
				r.FBConversation = Instance;
				r.psid = r.FBConversation.psid ? r.FBConversation.psid : undefined;
			}

			var message_data;
			switch(r.type){
				case 'text':
					message_data = {
						recipient: {
							id: r.psid,
						},
						message: {
							text: r.message,
							metadata: 'DEVELOPER_DEFINED_METADATA',
						},
					};
					break;

				case 'image':
					//var url = settings.SERVER_URL + settings.base_dir+"/msg/media/"+r.filenames[0];
					message_data = {
						recipient: {
							id: r.psid,
						},
						message: {
							attachment: {
								type: "image",
								payload: {
									//url: url
									attachment_id:r.attachment_ids[0]
								}
							}
						},
					};
					break;

				case 'generic_template':
					message_data = {
						recipient: {
							id: r.psid,
						},
						message:{
						    attachment:{
						      type:"template",
						      payload:{
						        template_type:"generic",
						        elements:[
						           {
						            title:"Welcome to Peter\'s Hats",
						            image_url:"https://www.sy.com.my/shop/234-thickbox_default/6-port-usb-charger-with-current-measurement.jpg",
						            subtitle:"We\'ve got the right hat for everyone.",
						            default_action: {
						              type: "web_url",
						              url: "https://www.sy.com.my/shop/en/electronics/49-6-port-usb-charger-with-current-measurement.html",
						              messenger_extensions: true,
						              webview_height_ratio: "tall",
						              fallback_url: "https://www.sy.com.my/shop"
						            },
						            buttons:[
						              {
						                type:"web_url",
						                url:"https://www.sy.com.my/shop",
						                title:"View Website"
						              },{
						                type:"postback",
						                title:"Start Chatting",
						                payload:"DEVELOPER_DEFINED_PAYLOAD"
						              }              
						            ]      
						          }
						        ]
						      }
						    }
					  	}
					};
					break;

				case 'read receipt':
					message_data = sendReadReceipt(r.psid);
					break;
				default:
					break;
			}

			return callSendAPI(message_data,r.type,{
				pid:r.pid,
				t_mid:r.t_mid,
				psid:(r.psid ? r.psid : undefined),
				id_employee:socket.request.user.id_employee
			});

		}).then(function(r2){
			io.local.emit('NEW_MESSAGE', {
				username: socket.username,
				Message:r2.FBMessage,
				Conversation:r2.FBConversation,
				pid:r.pid
			});
			console.log('======================== socket.on(NEW_MESSAGE) END =========================');
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('ADD_FILES',function(data){
		console.log('======================== socket.on(ADD_FILE) =========================');
		var file_buffers = data.file_buffers;
		var file_infos = data.file_infos;
		var q = {pid:data.pid};
		var r = {FBUploads:[]};

		file_buffers.map((file_buffer,i)=>{
			//var file_buffer = data.file_buffer[0];
			console.log('======================== FILE_BUFFER =========================');
			console.log(file_buffer);
			console.log(file_buffer.length);
			console.log(file_infos[0].name);
			console.log(file_infos.length);
			var file_info = file_infos[i];
			var length = file_info.filename_ori.length;
			file_info.filename = randomString('16','#a')+'.'+file_info.filename_ori.substring(length-3,length);
			var stream = fs.createWriteStream(BASEDIR_IMAGE+file_info.filename);
			stream.once('open', function(fd) {
			  stream.write(file_buffer);
			  stream.end();
			});
		});

  		Promise.mapSeries(file_infos,function(file_info,i){
			return rq({
				uri: 'https://graph.facebook.com/v2.8/me/message_attachments',
				qs: {
					access_token: PAGE_ACCESS_TOKEN_MESSENGER[q.pid]
				},
				method: 'POST',
				json: {
				  message:{
				    attachment:{
				      type:"image", 
				      payload:{
				        url:settings.SERVER_URL + settings.base_dir+"/msg/media/"+file_info.filename, 
				        is_reusable:true,
				      }
				    }
				  }
				},
			}).then(facebookGraphAPIHandler);
  		}).then(function(attachment_ids){
  			console.log('$$$ attachment_ids');
  			console.log(attachment_ids);
  			r.attachment_ids = attachment_ids.map((x)=>(x.attachment_id));
			return Promise.mapSeries(file_infos,function(file_info,i){
				return FBUpload.create({
					name:file_info.name ? file_info.name : file_info.filename_ori,
					type:file_info.type,
					filename:file_info.filename,
					created_by:socket.request.user.id_employee,
					pid:q.pid,
					attachment_id:r.attachment_ids
				}).then(sequelizeHandler)
				.then(function(Instance){
					if(Instance){
						r.FBUploads[i] = Instance;
						return Promise.mapSeries(file_info.tag_ids,function(tag_id,j){
							return FBXUploadTag.create({
								upload_id_tag_id:Instance.upload_id+'_'+tag_id,
								upload_id:Instance.upload_id,
								tag_id:tag_id
							}).then(sequelizeHandler)
							.then(function(Instance){
								console.log('$$$ FBXUploadTag');
								console.log(Instance.upload_id_tag_id);
							});
						});
					}
				});
			});
		}).then(function(unknown){
			console.log('$$$ FBUpload.findAll');
			console.log(r.attachment_ids);
			return FBUpload.findAll({
				where:{attachment_id:{$in:r.attachment_ids}},
				include:[{
					model:FBXTag
				}]
			}).then(sequelizeHandler);
		}).then(function(Instances){
			io.local.emit('ADD_FILES',{pid:q.pid,FBUploads:Instances});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('DELETE_FILES',function(data){
		console.log('======================== socket.on(DELETE_FILES) =========================');
		var q = {
			pid:data.pid,
			attachment_ids:data.attachment_ids
		};
		var r = {};

		FBUpload.findAll({where:{attachment_id:{$in:q.attachment_ids}}})
		.then(sequelizeHandler)
		.then(function(Instances){
			if(Instances){

				r.FBUploads = Instances;
				var filenames = Instances.map((x)=>(x.filename));
				var filepaths = [];
				filenames.map((filename,i)=>{
					filepaths.push(BASEDIR_IMAGE+filename)
				});

				function unlinkFiles(filepaths){
					fs.unlink(filepaths[0], function(err){
					    if(err) {
					    	throw err;
					    } else {
					    	console.log('======================== '+filepaths[0]+' DELETED =========================');
							unlinkFiles(filepaths.shift());
					    }
					});
				}

				r.upload_ids = r.FBUploads.map((x)=>(x.upload_id));
				return r.upload_ids;
			}
		}).then(function(upload_ids){
			return Promise.mapSeries(q.attachment_ids,function(attachment_id,i){
				return FBUpload.destroy({where:{attachment_id:attachment_id}})
				.then(sequelizeHandler)
				.then(function(Instance){
					return FBXUploadTag.destroy({where:{upload_id:{$in:r.upload_ids}}})
					.then(sequelizeHandler);
				});
			});
		}).then(function(unknown){
			io.local.emit('DELETE_FILES',{pid:q.pid,attachment_ids:q.attachment_ids});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_SREPLIES',function(data){
		var q = {pid:data.pid};
		console.log('======================== socket.on(GET_SREPLIES) =========================');
		FBSReply.findAll({where:{pid:q.pid}})
		.then(function(Instances){
			if(Instances){
				socket.emit('GET_SREPLIES',{pid:q.pid,FBSReplies:Instances});
			}
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('ADD_SREPLY',function(data){
		console.log('======================== socket.on(ADD_SREPLY) =========================');
		var q = {
			pid:data.pid,
			title:data.title,
			message:data.message,
			attachment_id:data.attachment_id
		};

		new Promise(function(resolve,reject){
			if(typeof q.attachment_id !== 'undefined'){
				FBUpload.findOne({where:{attachment_id:q.attachment_id}})
				.then(x=>sequelizeHandler(x,{attachment_id:q.attachment_id},'FBUpload.findOne'))
				.then(function(Instance){
					resolve(Instance);
				});
			}else{
				resolve(false);
			}
		}).then(function(Instance){
			var fields = {
				title:q.title,
				message:q.message,
				upload_filename:Instance ? Instance.filename : undefined,
				attachment_id:Instance ? Instance.attachment_id : undefined,
				id_employee:socket.request.user.id_employee,
				pid:q.pid
			};
			return FBSReply.create(fields)
			.then(x=>sequelizeHandler(x,{fields:fields},'FBSReply.create'));
		}).then(function(Instance){
			io.local.emit('ADD_SREPLY',{pid:q.pid,FBSReply:Instance});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('DELETE_SREPLIES',function(data){
		console.log('======================== socket.on(DELETE_SREPLIES) =========================');
		var q = {
			pid:data.pid,
			sreply_ids:data.sreply_ids
		};

		FBSReply.destroy({where:{sreply_id:{$in:q.sreply_ids}}})
		.then(x=>sequelizeHandler(x,{sreply_id:{$in:q.sreply_ids}},'FBSReply.destroy'))		
		.then(function(deleted_rows){
			io.local.emit('DELETE_SREPLIES',{pid:q.pid,sreply_ids:q.sreply_ids});
		}).catch(err=>catchHandler(err,null,socket));
	});

	socket.on('GET_TAGS',function(data){
		console.log('======================== socket.on(GET_TAGS) =========================');

		FBXTag.findAll()
		.then(x=>sequelizeHandler(x,{},'FBXTag.findAll'))
		.then(function(Instances){
			socket.emit('GET_TAGS',{FBXTags:Instances});
		}).catch(err=>catchHandler(err,null,socket));
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function(username) {
		if (addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers,
		});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers,
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function() {
		socket.broadcast.emit('typing', {
			username: socket.username,
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function() {
		socket.broadcast.emit('stop typing', {
			username: socket.username,
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		console.log('disconnect');
		console.log('socket_id='+socket.id);
		console.log(socket.request.user);
		READINGS = deleteReadings(READINGS,socket.request.user.id_employee,socket.id);
		io.local.emit('DELETE_READINGS', {
			id_employee:socket.request.user.id_employee,
			socket_id:socket.id
		});


		if (addedUser) {
			--numUsers;

			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers,
			});
		}
	});

});

router.get('/autopm', function(req, res) {
	res.render('autopm');
});

router.get('/bulk2', function(req, res) {
	res.render('bulk_immutable');
});

router.get('/msger', function(req, res) {
	res.render('msger');
});

router.get('/msger2', function(req, res) {
	res.render('msger2');
});

router.get('/getlongtoken', function(req, res) {
	res.render('getlongtoken');
});

router.post('/getlongtoken', function(req, res) {
	let q = req.body;
	let Pages = q.data;
	let FBPages = [];
	let promises = [];
	console.log(Pages);
	Pages.map(function(Page, i) {
		promises.push(
			FBPage.findOrCreate({
				where: {pid: Page.id},
				defaults: {
					pid: Page.id,
					name: Page.name,
					access_token: Page.access_token,
				},
			})
		);
	});

	Promise.all(promises)
	.then(function(Instances) {
		FBPages = Instances;
		for(let i=0; i<FBPages.length; i++) {
			FBPages[i] = FBPages[i][0];
			console.log('FOUND/CREATED PAGE ID = '+FBPages[i].pid);
		}

		let promises = [];
		FBPages.map((FBPage, i)=>{
			promises.push(
				rq({
					uri: 'https://graph.facebook.com/v2.8/oauth/access_token',
					qs: {
						grant_type: 'fb_exchange_token',
						client_id: settings.fb.app_id,
						client_secret: settings.fb.app_secret,
						fb_exchange_token: FBPage.access_token,
					},
					method: 'GET',
					json: {},
				})
			);
		});

		return Promise.all(promises);
	}).then(function(Bodys) {
		res.send({Bodys});
		let promises = [];

		FBPages.map((FBPage, i)=>{
			FBPage.access_token_long = Bodys[i].access_token;
			FBPage.expires_in = Bodys[i].expires_in;
			promises.push(FBPage.save());
		});
		return Promise.all(promises);
	}).then(function(Instances) {
		if(Instances) {
			Instances.map((Instance, i)=>{
				console.log('SAVED LONG LIVE TOKEN #'+i+' --- '+Instance.access_token_long);
			});
		}
	}).catch(function(err) {
		catchHandler(err,res,undefined);
	});
});

function nextFBRequest(resolve, reject, queryParams, r, breakCondition) {
	function getNextFBRequest(queryParams, r={data: []}, breakCondition) {
		if(r.data.length === 0) {
			uri = queryParams.uri;
			qs = queryParams.qs;
		}else{
			if(r.paging.next) {
				uri = r.paging.next;
				qs = null;
			}else if(r.paging.cursors) {
				uri = queryParams.uri;
				qs = queryParams.qs;
				qs.after = r.paging.cursors.after;
			}else{
				throw new Error('Paging of Facebook Response is not recognized');
			}
		}

		return (()=>(
		rq({
			uri: uri,
			qs: qs,
			method: 'GET',
			json:true
		}).then(facebookGraphAPIHandler)))()
		.then(function(response) {
			if(response.data && response.data.length>=1) {
				r.data = r.data.concat(response.data);
				r.paging = response.paging;
				r.continue = true;
				r = breakCondition(r, response);
			}else if(response.data && response.data.length === 0) {
				r.data = r.data;
				r.paging = response.paging;
				r.continue = false;
			}
			return r;
		}).catch(function(err){
			throw err;
		});
	}

	getNextFBRequest(queryParams, r, breakCondition)
	.then(function(r) {
		if (!r.continue) {
			resolve(r);
		} else {
			console.log('r.data.length ============ '+r.data.length);
			console.log(r.paging.next ? 'next_page=yes' : 'next_page=no');
			nextFBRequest(resolve, reject, queryParams, r, breakCondition);
		}
	}, reject);
}
/*
router.get('/countcomments', function(req, res) {
	let pid = req.query.page_id;
	let post_id = req.query.post_id;
	let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];

	let uri = 'https://graph.facebook.com/v2.8/'+post_id+'/comments';
	let qs = {
		access_token: PAGE_ACCESS_TOKEN,
		fields: 'id,created_time,from,message,can_reply_privately,can_comment,can_hide,can_remove,comment_count',
		limit: 100,
		order: 'reverse_chronological',
	};

	new Promise(function(resolve, reject) {
			// start first iteration of the loop
			nextFBRequest(resolve, reject, {uri: uri, qs: qs}, {data: []}, function(r, response) {
				let list = response.data;
				list.map((item, i)=>{
					item.id === '' ? r.continue = false : null;
				});

				return r;
			});
	}).then(function(r) {
			// process results here
			let promises = [];
			r.data.map((Comment2, index)=>{
				let Comment = r.data[r.data.length-1-index];
				promises.push(
					FBComment.findOrCreate({
						where: {comment_id: Comment.id},
						defaults: {
							created_time: Comment.created_time,
							comment_id: Comment.id,
							post_id: post_id,
							uid: Comment.from.id,
							t_mid: undefined,
							message: Comment.message,
							can_reply_privately: Comment.can_reply_privately,
							can_comment: Comment.can_comment,
							can_hide: Comment.can_hide,
							can_remove: Comment.can_remove,
							comment_count: Comment.comment_count,
						},
					})
				);
			});
			return Promise.all(promises);
	}).then(function(Instances) {
			console.log('END OF INSERTING');
			return sequelize.query(
				` SELECT DATE(DATE_ADD(created_time,INTERVAL 8 HOUR)) as created_date, COUNT(id) as count 
					FROM fb_comment
					WHERE post_id=:post_id 
					GROUP BY created_date`,
			{replacements: {post_id: post_id}, type: sequelize.QueryTypes.SELECT});
	}).then(function(rows) {
			res.send(rows);
	}).catch(function(err) {
			console.log(err);
	});
});
*/
router.get('/upgrade',function(req,res){
	var r = {};
	FBAttachment.findAll({attributes:['attachment_id','m_mid']})
	.then(function(Instances){
		if(Instances){
			r.FBAttachments = Instances;
			return Promise.mapSeries(r.FBAttachments,function(FBAttachment,i){
				return FBMessageAttachment.create({
					m_mid_attachment_id:FBAttachment.m_mid+'_'+FBAttachment.attachment_id,
					m_mid:FBAttachment.m_mid,
					attachment_id:FBAttachment.attachment_id
				});
			});
		}
	}).then(function(unknown){
		res.send({length:unknown.length});
	});
});

router.get('/test',function(req,res){

	FBPage.destroy({where:{pid:123123}})
	.then(function(Instance){
		console.log('destroy - yes');
		console.log(typeof Instance); //number
		console.log(Instance ? true : false); //true
		console.log(Instance); //1
		return FBPage.upsert({
			pid:123123,
			name:'testing'
		},{where: {pid: 123123}});
	}).then(function(Instance){
		console.log('upsert - insert');
		console.log(typeof Instance); //boolean
		console.log(Instance ? true : false); //true
		console.log(Instance); //true
		return FBPage.upsert({
			pid:123123,
			name:'testing'
		},{where: {pid: 123123}});
	}).then(function(Instance){
		console.log('upsert - update');
		console.log(typeof Instance); //boolean
		console.log(Instance ? true : false); //false
		console.log(Instance); //false
	});

	/*
	FBPage.destroy({where:{pid:123123}})
	.then(function(Instance){	
		console.log('destroy - yes');
		console.log(typeof Instance); //number
		console.log(Instance ? true : false); //true
		console.log(Instance); //1
		return FBPage.create({pid:123123,name:'testing'})
	}).then(function(Instance){
		console.log('create - yes');
		console.log(typeof Instance); //object
		console.log(Instance instanceof Sequelize.Instance); //true
		console.log(Instance ? true : false); //true
		return FBPage.create({pid:123124});
	}).then(function(Instance){
		// bypass
	}).catch(function(err){
		console.log('create - no');
		if(err instanceof Error){
			console.log(err.name);
			console.log(err.message);
		}
	});
	*/
	/*
	Employee.findOne({where:{id_employee:1}})
	.then(function(Instance){
		console.log('findOne - yes');
		console.log(typeof Instance); //object
		console.log(Instance instanceof Sequelize.Instance); //true
		console.log(Instance ? true : false); // true
		return Employee.findOne({where:{id_employee:10000}});
	}).then(function(Instance){
		console.log('findOne - no');
		console.log(typeof Instance); //object
		console.log(Instance instanceof Sequelize.Instance); //false
		console.log(Instance ? true : false); //false
		console.log(Instance); //null
		return Employee.findAll({where:{id_employee:1}});
	}).then(function(Instance){
		console.log('findAll - yes');
		console.log(typeof Instance); //object
		console.log(Instance instanceof Array); //true
		console.log(Instance.length); //1
		return Employee.findAll({where:{id_employee:10000}});
	}).then(function(Instance){
		console.log('findOne - no'); 
		console.log(typeof Instance); //object
		console.log(Instance instanceof Array); //true
		console.log(Instance.length); //0
		console.log(Instance); //[]
	});
	*/
	/*
	new Promise(function(resolve,reject){
		resolve(true);
	}).then(function(success){
		throw new Error(JSON.stringify({message:'This this for the user to see.',route:'/test',f:'Promise'}));
	}).catch(function(err){
		catchHandler(err,res,undefined);
	});
	*/
	/*
	var q = {t_mid:req.query.t_mid};
	var r = {};

	FBConversation.findOne({where:{t_mid:q.t_mid}})
	.then(function(Instance){
		r.FBConversation = Instance;
		return FBConversation.upsert({
			t_mid:r.FBConversation.t_mid,
			pid:r.FBConversation.pid,
			pid_uid:r.FBConversation.pid_uid,
			link:r.FBConversation.link,
			updated_time:r.FBConversation.updated_time,
			name:r.FBConversation.name,
			message_count:r.FBConversation.message_count,
			snippet:undefined
		},{where: {t_mid: q.t_mid}});
	}).then(function(success){
		return FBConversation.findOne({where:{t_mid:q.t_mid}});
	}).then(function(Instance){
		res.send({before:r.FBConversation,after:Instance});
	});
	*/
});

// MESSENGER SAMPLE FUNCTIONS

router.get('/webhook', function(req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
			req.query['hub.verify_token'] === VALIDATION_TOKEN) {
		console.log('Validating webhook');
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error('Failed validation. Make sure the validation tokens match.');
		res.sendStatus(403);
	}
});

router.post('/webhook', function(req, res) {
	let data = req.body;
	console.log(JSON.stringify(data));

	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function(pageEntry) {
			let pageID = pageEntry.id;
			let timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			if(pageEntry.messaging) {
				pageEntry.messaging.forEach(function(messagingEvent) {
					if (messagingEvent.optin) {
						//receivedAuthentication(messagingEvent);
					} else if (messagingEvent.message) {
						receivedMessage(messagingEvent);
					} else if (messagingEvent.delivery) {
						receivedDeliveryConfirmation(messagingEvent);
					} else if (messagingEvent.postback) {
						//receivedPostback(messagingEvent);
					} else if (messagingEvent.read) {
						//receivedMessageRead(messagingEvent);
					} else if (messagingEvent.account_linking) {
						//receivedAccountLink(messagingEvent);
					} else {
						console.log('Webhook received unknown messagingEvent: ', messagingEvent);
					}
				});
			}else if(pageEntry.changes && pageEntry.changes instanceof Array){
				pageEntry.changes.map((change,i)=>{
					if(change.field === 'conversations'){
						graphAPIConversationEvent(change);
					}else{
						console.log('\x1b[36m%s\x1b[0m', 'this is not a graph API conversation event');
						console.log('\x1b[36m%s\x1b[0m', change);
					}
				});
			}else{
				console.log('\x1b[36m%s\x1b[0m', 'this is not a messaging update');
				console.log('\x1b[36m%s\x1b[0m', pageEntry);
			}
		});

		// Assume all went well.
		//
		// You must send back a 200, within 20 seconds, to let us know you've
		// successfully received the callback. Otherwise, the request will time out.
		res.sendStatus(200);
	}
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
router.get('/authorize', function(req, res) {
	let accountLinkingToken = req.query.account_linking_token;
	let redirectURI = req.query.redirect_uri;

	// Authorization Code should be generated per user by the developer. This will
	// be passed to the Account Linking callback.
	let authCode = '1234567890';

	// Redirect users to this URI on successful login
	let redirectURISuccess = redirectURI + '&authorization_code=' + authCode;

	res.render('authorize', {
		accountLinkingToken: accountLinkingToken,
		redirectURI: redirectURI,
		redirectURISuccess: redirectURISuccess,
	});
});

router.post('/autopmpm', function(req, res) {
	console.log('======================== AUTOPM x (N)  =========================');
	var pid = req.query.pid;
	var pms = req.body;
	var r = {};
	console.log(pms);
	Promise.mapSeries(pms,(pm,i)=>{
		console.log(pm);
		return createConversationProduct(pm.t_mid,(pm.id_product ? pm.id_product : 0),pm.comment_id,pm.post_id,undefined)
	}).then(function(Instances){
		var t_mids = pms.map((pm)=>(pm.t_mid));
		return FBConversation.findAll({
			where:{t_mid:{$in:t_mids}},
			include:[{
				model:FBLabel
			},{
				model:Product,
				attributes:['id_product','reference']
			}]
		}).then(x=>sequelizeHandler(x,{t_mid:{$in:t_mids}},'FBConversation.findAll'));
	}).then(function(Instances){
		r.FBConversations = Instances;
		io.local.emit('GET_CONVERSATIONS', {pid:pid,Conversations:r.FBConversations});
		res.send({success:true,pms:pms});
	}).catch(function(err){
		catchHandler(err,res,undefined);
	});
});

router.get('/products', function(req,res){
	Product.findAll({
		attributes:['id_product','reference']
	}).then(function(Instances){
		res.send(Instances);
	});
});

router.get('/media/:filename',function(req,res){
  var options = {
    root: __dirname + '/../data/image/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
console.log(options.root);
console.log(file_name);
  var file_name = req.params.filename;
  res.sendFile(file_name, options, function (err) {
  	console.log('Sent:', file_name);
  	/*
    if (err) {
      next(err);
    } else {
      console.log('Sent:', file_name);
    }
    */
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	let signature = req.headers['x-hub-signature'];

	if (!signature) {
		// For testing, let's log an error. In production, you should throw an
		// error.
		console.error('Couldn\'t validate the signature.');
	} else {
		let elements = signature.split('=');
		let method = elements[0];
		let signatureHash = elements[1];

		let expectedHash = crypto.createHmac('sha1', APP_SECRET)
												.update(buf)
												.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error('Couldn\'t validate the request signature.');
		}
	}
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;
	let timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger'
	// plugin.
	let passThroughParam = event.optin.ref;

	console.log('Received authentication for user %d and page %d with pass ' +
		'through param \'%s\' at %d', senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, 'Authentication successful');
}

function graphAPIConversationEvent(change){
	var q = {
		pid:change.value.page_id,
		t_mid:change.value.thread_id
	};
	var r ={};
	var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[q.pid];

	Promise.all([
		getConversation(PAGE_ACCESS_TOKEN,q.t_mid),
		getMessages(PAGE_ACCESS_TOKEN,q.t_mid,{limit:5,total_count:1,matchFunc:((x,i)=>(false))}),
		findAllMessages(q.t_mid,{limit:5})
	]).spread(function(Conversation,Messages,Instances){
		if(Conversation && Messages){
			r.Conversation = Conversation;
			r.Messages = Messages;
			if(Instances){
				r.FBMessages = Instances;
			}else{
				r.FBMessages = [];
			}
			console.log('############# MESSAGE #############');
			console.log('name='+r.Conversation.participants.data[0].name);
			console.log('message='+(r.Messages[0].message ? r.Messages[0].message : 'ATTACHMENT'));
			console.log('________________________________________');

			function filterNewMessages(Messages,FBMessages){
				var MessagesNew = [];
				Messages.map((Message,i)=>{
					var index = FBMessages.findIndex((x,i)=>(x.m_mid === Message.id));
					if(index === -1){
						MessagesNew.push(Message);
					}else{
						//DO NOTHING
					}
				});
				return MessagesNew;
			}

			var MessagesNew = filterNewMessages(r.Messages,r.FBMessages);

			return Promise.all([
				upsertConversation(r.Conversation),
				upsertMessages(q.t_mid,MessagesNew)
			]);
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({change:change}));
		}
	}).spread(function(is_insert_conversation,is_inserts_messages){
		return Promise.all([
			findOneConversation(q.t_mid),
			findAllMessages(q.t_mid,{limit:5})
		]);
	}).spread(function(fbconversation,fbmessages){
		io.local.emit('NEW_MESSAGE',{
			pid:q.pid,
			Conversation:fbconversation,
			Messages:fbmessages
		});
	}).catch(function(err){
		catchHandler(err,undefined,undefined);
	});
}


// INSERT into fb_message and then do the default messenger sample action - echo
function receivedMessage(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;
	let timeOfMessage = event.timestamp;
	let message = event.message;

	console.log('======================== RECEIVE MSG =========================');
	console.log(JSON.stringify(event));

	let isEcho = message.is_echo;
	let messageId = message.mid;
	let appId = message.app_id;
	let metadata = message.metadata;

	// You may get a text or attachment but not both
	let messageText = message.text;
	let messageAttachments = message.attachments;
	let quickReply = message.quick_reply;
	
	var r = {
		pid:event.recipient.id,
		psid:event.sender.id,
		m_mid:toMMID(messageId),
		event:event,
		message:message
	};
	console.log('======================== 1 getTMID =========================');
	return getTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],r.m_mid,r.psid,r.pid)
	.then(function(t_mid){
		if(t_mid){
			r.t_mid = t_mid;
			console.log('======================== 2 getAndUpsertMessageConversation =========================');
			return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,event,event.sender.id,undefined);
		}
	}).then(function(result){
		if(result){
			r.FBConversation = result.FBConversation;
			r.FBMessage = result.FBMessage;
			console.log('======================== 3* io.local.emit(NEW_MESSAGE) START =========================');
			io.local.emit('NEW_MESSAGE', {Conversation:r.FBConversation,Message:r.FBMessage,pid:r.pid});
		}
	}).catch(function(err) {
		catchHandler(err,undefined,undefined);
	});
}

function receivedDeliveryConfirmation(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;
	let delivery = event.delivery;
	let messageIDs = delivery.mids;
	let watermark = delivery.watermark;
	let sequenceNumber = delivery.seq;
	
	if (messageIDs) {
		messageIDs.forEach(function(messageID) {

			console.log('========================MSG DELIVERY=========================');
			console.log(event);

			let r = {
				m_mid:toMMID(messageID),
				pid:recipientID,
				psid:senderID
			};

			console.log('======================== 1 getTMID =========================');
			return getTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],r.m_mid,r.psid,r.pid)
			.then(function(t_mid){
				if(t_mid){
					r.t_mid = t_mid;
					console.log('======================== 2 getAndUpsertMessageConversation =========================');
					return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,event,event.sender.id,undefined);
				}
			}).then(function(result){
				if(result){
					r.FBConversation = result.FBConversation;
					r.FBMessage = result.FBMessage;
					console.log('======================== 3* io.local.emit(NEW_MESSAGE) START =========================');
					io.local.emit('NEW_MESSAGE', {Conversation:r.FBConversation,Message:r.FBMessage,pid:r.pid});
				}
			}).catch(function(err) {
				catchHandler(err,undefined,undefined);
			});
		});
	}

	console.log('All message before %d were delivered.', watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;
	let timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback
	// button for Structured Messages.
	let payload = event.postback.payload;

	console.log('Received postback for user %d and page %d with payload \'%s\' ' +
		'at %d', senderID, recipientID, payload, timeOfPostback);

	// When a postback is called, we'll send a message back to the sender to
	// let them know it was successful
	sendTextMessage(senderID, 'Postback called');
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	let watermark = event.read.watermark;
	let sequenceNumber = event.read.seq;

	console.log('========================MSG READ=========================');
	console.log('Received message read event for watermark %d and sequence ' +
		'number %d', watermark, sequenceNumber);

	let r = {};
	console.log('========================FIND MSG (START)=========================');
	var where = {
			timestamp: {$lte: event.read.watermark},
			psid_sender: event.sender.id,
			psid_recipient: event.recipient.id,
		};
	FBMessage.findAll({
		where: where,
	}).then(x=>sequelizeHandler(x,where,'FBMessage.findAll'))
	.then(function(Instances) {
		console.log('========================FIND MSG (END)=========================');
		console.log('========================UPDATE MSG (START)=========================');
		r.FBMessages = Instances;
		let queryList = [];
		r.FBMessages.map(function(FBMessage, index) {
			FBMessage.read_timestamp = event.timestamp;
			queryList.push(FBMessage.save());
		});
		return Promise.all(queryList);
	}).catch(function(err) {
		catchHandler(err,undefined,undefined);
	});
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;

	let status = event.account_linking.status;
	let authCode = event.account_linking.authorization_code;

	console.log('Received account link event with for user %d with status %s ' +
		'and auth code %s ', senderID, status, authCode);
}

function sendTextMessage(conversation_info, messageText) {
	let messageData = {
		recipient: {
			id: conversation_info.psid,
		},
		message: {
			text: messageText,
			metadata: 'DEVELOPER_DEFINED_METADATA',
		},
	};

	return callSendAPI(messageData,conversation_info);
}

function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  return {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };
}


/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(message_data,action_type,conversation_info=undefined) {

	var r = conversation_info ? conversation_info : {};

	if(r.pid === undefined && r.t_mid === undefined){
		throw new Error(JSON.stringify({message:'Function Parameter is undefined',r:r}));
	}

	return new Promise(function(resolve,reject){

		if(action_type === 'text' && !r.psid){
			console.log('======================== postMessageByTMID =========================');
			return postMessageByTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,message_data.message.text)
			.then(function(response){
				if(response.id){
					r.m_mid = response.id;
					resolve('m_mid');
				}else{
					reject(new FBGraphAPINoResultError(JSON.stringify({r:r})));
				}
			});
		}else{
			if(r.psid){
				console.log('======================== postMessageByPSID =========================');
				return postMessageByPSID(PAGE_ACCESS_TOKEN_MESSENGER[r.pid],message_data)
				.then(function(response){
					if(response.message_id){
						r.m_mid = toMMID(response.message_id);
						resolve('m_mid');
					}else if(response.recipient_id){
						r.psid = response.recipient_id;
						resolve('psid');
					}else{
						reject(new FBGraphAPINoResultError(JSON.stringify({r:r})));
					}
				}).catch(function(err){
					if(action_type === 'text'){
						postMessageByTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,message_data.message.text)
						.then(function(response){
							if(response.id){
								r.m_mid = response.id;
								resolve('m_mid');
							}else{
								reject(new FBGraphAPINoResultError(JSON.stringify({r:r})));
							}
						});
					}else{
						reject(err);
					}
				});
			}else{
				reject(new Error('PSID is required for this action type'));
			}
		}
	}).then(function(type){
		if(type){
			if(type === 'm_mid'){
				console.log('======================== getAndUpsertMessageConversation =========================');
				return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,undefined,(r.psid?r.psid:undefined),(r.id_employee?r.id_employee:undefined));
			}else if(type === 'psid'){
				console.log('======================== getAndUpsertConversation =========================');
				return getAndUpsertConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.psid);
			}
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({r:r}));
		}
	}).then(function(result) {
		if(result.FBConversation){
			r.FBConversation = result.FBConversation;
		}
		if(result.FBMessage){
			r.FBMessage = result.FBMessage;
		}
		return r;
	});
}

function postMessageByPSID(PAGE_ACCESS_TOKEN_MESSENGER,message_data){
	return rq({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token: PAGE_ACCESS_TOKEN_MESSENGER},
		method: 'POST',
		json: message_data
	}).then(facebookGraphAPIHandler);
}

function postMessageByTMID(PAGE_ACCESS_TOKEN,t_mid,message){
	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+t_mid+'/messages',
		qs: {access_token: PAGE_ACCESS_TOKEN,message:message},
		method: 'POST',
		json: true
	}).then(facebookGraphAPIHandler);
}

function getConversation(PAGE_ACCESS_TOKEN,t_mid){
	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+t_mid,
		qs:{
			access_token: PAGE_ACCESS_TOKEN,
			fields: 'id,snippet,updated_time,message_count,unread_count,link,participants,messages.limit(1){from}'
		},
		method:'GET',
		json:true
	}).then(facebookGraphAPIHandler);
}

function getConversations2(PAGE_ACCESS_TOKEN, pid,options={}){
	let last_message_date = options.last_message_date_input ? moment(options.last_message_date_input) : moment();
	let limit = options.limit !== undefined ? options.limit : 100;
	let fields = options.fields !== undefined ? options.fields : 'link,id,message_count,snippet,updated_time,unread_count,participants,messages{message,id,created_time,from,to,attachments}';

	let result = {};

	return new Promise(function(resolve, reject) {
		let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
		let qs = {
			access_token: PAGE_ACCESS_TOKEN,
			fields: fields,
			limit: limit,
		};

		// start first iteration of the loop
		nextFBRequest(resolve, reject, {uri: uri, qs: qs}, {data: []}, function(r, response) {
			let list = response.data;
			list.map((item, i)=>{
				let tmp = last_message_date.diff(moment(item.updated_time), 'seconds');
				i === 0 ? console.log(item.updated_time+'___'+tmp + '___' + (tmp >= 0)) : null;
				if(last_message_date.diff(moment(item.updated_time), 'seconds') >= 0) {
					r.continue = false;
				}
			});
			result = r;
			return r;
		});
	});
}

function getConversations(PAGE_ACCESS_TOKEN, pid,options={}){
	var last_message_date = options.last_message_date_input ? moment(options.last_message_date_input) : moment();
	var limit = options.limit !== undefined ? options.limit : 100;
	var fields = options.fields !== undefined ? options.fields : 'link,id,message_count,snippet,updated_time,unread_count,participants,messages{message,id,created_time,from,to,attachments}';
	
	var total_count = options.total_count;
	var matchFunc = options.matchFunc ? options.matchFunc : function(item,i){
		return (last_message_date.diff(moment(item.updated_time), 'seconds') >= 0) ;
	};

	var uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
	var qs = {
		access_token: PAGE_ACCESS_TOKEN,
		fields: fields,
		limit: limit,
	};

	return getFBGraphAPIItems(uri,qs,{total_count:total_count,matchFunc:matchFunc});
}

function getMessage(PAGE_ACCESS_TOKEN,m_mid){
	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+m_mid,
		qs: {
			access_token: PAGE_ACCESS_TOKEN,
			fields: 'attachments{mime_type,name,size,file_url,image_data,video_data,id},created_time,from,id,message,to'
		},
		method: 'GET',
			json: true
		}).then(facebookGraphAPIHandler);
}

function getMessages(PAGE_ACCESS_TOKEN,t_mid,options={}){
	var limit = typeof options.limit !== 'undefined' ? options.limit : 100;
	var total_count = options.total_count;
	var matchFunc = options.matchFunc;

	let uri = 'https://graph.facebook.com/v2.8/'+t_mid+'/messages';
	let qs = {
		access_token: PAGE_ACCESS_TOKEN,
		fields: 'id,message,created_time,from,to,attachments',
		limit: limit
	};

	return getFBGraphAPIItems(uri,qs,{total_count:total_count,matchFunc:matchFunc})
		.catch(function(err){
			console.log('you fucked up in getMessages');
		});
}

function getFBGraphAPIItems(uri,qs,options={}){
	var total_count = typeof options.total_count !== 'undefined' ? options.total_count : 100;
	var matchFunc = typeof options.matchFunc !== 'undefined' ? options.matchFunc : ((x,i)=>(false));

	return new Promise(function(resolve, reject) {
		// start first iteration of the loop
		nextFBRequest(resolve, reject, {uri: uri, qs: qs}, {data: []}, function(r, response) {
			let list = response.data;
			if(r.data && r.data.length>=1){
				if(total_count && (total_count <= r.data.length)){
					r.continue = false;
					resolve(r);
				}else{
					list.map((item, i)=>{
						if(matchFunc(item,i)){
							r.continue = false;
							resolve(r);
						}
					});
				}
			}else{
				reject('No data returned from request');
			}
			return r;
		});
	}).then(function(r){
		return r.data;
	}).catch(function(err){
		throw err;
	});
}

function getPageLabels(PAGE_ACCESS_TOKEN,options={}){
	var limit = options.limit === undefined ? 100 : options.limit;
	let uri = 'https://graph.facebook.com/v2.8/me/labels';
	let qs = {
		access_token: PAGE_ACCESS_TOKEN,
		limit: limit
	};
	return fbAPIRequestIterator(uri,qs,limit,options);
}

function postPageLabel(PAGE_ACCESS_TOKEN,uid,label_id,options={}){
	var is_delete = options.is_delete === undefined ? false : options.is_delete;

	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+label_id+'/users',
		qs: {
			access_token: PAGE_ACCESS_TOKEN,
			user_ids: '['+uid+']'
		},
		method: is_delete ? 'DELETE' : 'POST',
			json: true
  	}).then(facebookGraphAPIHandler);
}

function deletePageLabel(PAGE_ACCESS_TOKEN,uid,label_id){
	return postPageLabel(PAGE_ACCESS_TOKEN,uid,label_id,{is_delete:true});
}


function fbAPIRequestIterator(uri,qs,limit,options={}){
	var total_count = options.total_count === undefined ? limit-1 : options.total_count;
	var matchFunc = options.matchFunc === undefined ? (x,i)=>(false) : options.matchFunc;

	return new Promise(function(resolve, reject) {
		// start first iteration of the loop
		nextFBRequest(resolve, reject, {uri: uri, qs: qs}, {data: []}, function(r, response) {
			let list = response.data;
			if(r.data && r.data.length>=1){
				if(total_count && (total_count >= r.data.length)){
					r.continue = false;
					resolve(r);
				}else{
					list.map((item, i)=>{
						if(matchFunc(item,i)){
							r.continue = false;
							resolve(r);
						}
					});
				}
			}else{
				reject('No data returned from request');
			}
			return r;
		});
	}).then(function(r){
		return r.data;
	});
}

function fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,requests){

	var batches = [];
	while(requests.length > 0){
		batches.push(JSON.stringify(requests.splice(0,50)));
	}

	return Promise.mapSeries(batches,(batch,i)=>{
		return rq({
			uri: 'https://graph.facebook.com/v2.8/',
			qs: {
				access_token: PAGE_ACCESS_TOKEN,
				batch: batch,
				include_headers:false
			},
			method: 'POST',
  			json: true
  		});
	}).then(function(response){
		var data = [];
		if(response && response.length >= 1){
			response.map((x,i)=>{
				data = data.concat(x);
			})
		}
		return data;
	});
}




function findOneMessage(m_mid){
	return FBMessage.findOne({
		where:{m_mid:m_mid},
		include:[{
			model:FBAttachment,
		},{
			model:Employee.scope('messenger')
		}]
	}).then(x=>sequelizeHandler(x,{m_mid:m_mid},'FBMessage.findOne'));
}

function findAllMessages(t_mid,options={}){
	var limit = (options.limit !== undefined) ? options.limit : undefined;
	var before = (options.before !== undefined) ? options.before : undefined;
	var where;
	if(before){
		where = {t_mid:t_mid,created_time:{$lt:before}};
	}else{
		where = {t_mid:t_mid};
	}

	return FBMessage.findAll({
		where:where,
		include:[{
			model:FBAttachment,
		},{
			model:Employee.scope('messenger')
		}],
		order:[['created_time','DESC']],
		limit:limit
	}).then(x=>sequelizeHandler(x,where,'FBMessage.findAll'));
}

function upsertMessages(t_mid,Messages){
	return Promise.mapSeries(Messages,(Message,i)=>{
		return FBMessage.upsert({
			m_mid: Message.id,
			t_mid: t_mid,
			created_time: Message.created_time,
			uid_from: Message.from.id,
			uid_to: Message.to.data[0].id,
			message: Message.message
			//attachment_id: Message.attachments ? Message.attachments.data[0].id : null 
		},{
			where: {m_mid: Message.id}
		}).then(x=>sequelizeHandler(x,{m_mid: Message.id},'FBMessage.upsert'))
		.then(function(FBMessage){
			//console.log(FBMessage);
			//IMAGES, VIDEO, AUDIO FROM PAGE & USER
			if(Message.attachments && Message.attachments.data.length >= 1){
				var Attachments = Message.attachments.data;
				return Promise.mapSeries(Attachments,function(Attachment){
					return FBAttachment.upsert({
						attachment_id:Attachment.id,
						//m_mid:Message.id,
						mime_type:Attachment.mime_type,
						name:Attachment.name,
						image_data:JSON.stringify(Attachment.image_data),
						file_url:Attachment.file_url,
						size:Attachment.size,
						video_data:JSON.stringify(Attachment.video_data)
					},{
						where:{attachment_id:Attachment.id}
					}).then(x=>sequelizeHandler(x,{attachment_id:Attachment.id},'FBAttachment.upsert'))
					.then(function(unknown){
						return FBMessageAttachment.upsert({
							m_mid_attachment_id:Message.id+'_'+Attachment.id,
							m_mid:Message.id,
							attachment_id:Attachment.id
						},{
							where:{m_mid_attachment_id:Message.id+'_'+Attachment.id}
						}).then(x=>sequelizeHandler(x,{m_mid_attachment_id:Message.id+'_'+Attachment.id},'FBMessageAttachment.upsert'));
					});
				});
			}
		});
	});
}

function upsertMessage(t_mid,Messages,event,id_employee){
	return Promise.mapSeries(Messages,(Message,i)=>{
		return FBMessage.upsert({
			m_mid: Message.id,
			t_mid: t_mid,
			created_time: Message.created_time,
			uid_from: Message.from.id,
			uid_to: Message.to.data[0].id,
			message: Message.message,
			//attachment_id: Message.attachments ? Message.attachments.data[0].id : null,
			delivery_timestamp: (event && event.delivery) ? event.timestamp : undefined,
			read_timestamp: (event && event.read) ? event.timestamp : undefined,
			id_employee: id_employee ? id_employee : undefined
		},{
			where: {m_mid: Message.id}
		}).then(x=>sequelizeHandler(x,{m_mid: Message.id},'FBMessage.upsert'))
		.then(function(is_insert){
			//IMAGES, VIDEO, AUDIO FROM PAGE & USER			
			if(Message.attachments && Message.attachments.data.length >= 1){
				var Attachments = Message.attachments.data;
				return Promise.mapSeries(Attachments,function(Attachment){
					return FBAttachment.upsert({
						attachment_id:Attachment.id,
						//m_mid:Message.id,
						mime_type:Attachment.mime_type,
						name:Attachment.name,
						image_data:JSON.stringify(Attachment.image_data),
						file_url:Attachment.file_url,
						size:Attachment.size,
						video_data:JSON.stringify(Attachment.video_data)
					}).then(x=>sequelizeHandler(x,{attachment_id: Attachment.id},'FBAttachment.upsert'))
					.then(function(is_insert){
						return FBMessageAttachment.upsert({
							m_mid_attachment_id:Message.id+'_'+Attachment.id,
							m_mid:Message.id,
							attachment_id:Attachment.id
						},{
							where:{m_mid_attachment_id:Message.id+'_'+Attachment.id}
						}).then(x=>sequelizeHandler(x,{m_mid:Message.id,attachment_id: Attachment.id},'FBMessageAttachment.upsert'));
					});
				});
			//STICKERS FROM USERS ONLY
			}else if(!Message.attachments && event && event.message && event.message.attachments && event.message.sticker_id){
				return Promise.mapSeries(event.message.attachments,function(attachment,i,N){
					//var attachment_id_generated = 'sid_'+randomString('16','#Aa');
					var attachment_id_generated = 'sid_'+event.message.sticker_id;
					return FBAttachment.upsert({
						attachment_id: attachment_id_generated,
						//m_mid: Message.id,
						type: attachment.type,
						payload: JSON.stringify(attachment.payload),
						sticker_id: event.message.sticker_id ? event.message.sticker_id : undefined,
					},{
						where:{sticker_id:event.message.sticker_id,m_mid:Message.id}
					}).then(x=>sequelizeHandler(x,{payload: payload},'FBAttachment.upsert'))
					.then(function(is_insert){
						return FBMessageAttachment.upsert({
							m_mid_attachment_id:Message.id+'_'+attachment_id_generated,
							m_mid:Message.id,
							attachment_id:attachment_id_generated
						},{
							where:{m_mid_attachment_id:Message.id+'_'+attachment_id_generated}
						}).then(x=>sequelizeHandler(x,{m_mid: Message.id,attachment_id:attachment_id_generated},'FBMessageAttachment.upsert'));
					});
				});
			}else{
				//skip to next then
			}
		});
	});
}

function findOneConversation(t_mid){
	return FBConversation.findOne({
		where:{
			t_mid:t_mid,
		},
		include:[{
			model:FBLabel
		},{
			model:Product,
			attributes:['id_product','reference']
		}]
	}).then(x=>sequelizeHandler(x,{t_mid:t_mid},'FBConversation.findOne'));
}

function upsertConversation(Conversation,psid,replied_last_by){
	console.log('$$$ upsertConversation');
	console.log(psid ? psid : 'INSERT UNDEFINED');
	//console.log(Conversation.messages.data[0].from.id);
	//console.log(Conversation.participants.data[0].id);
	//console.log(Conversation.messages.data[0].from.id === Conversation.participants.data[0].id);
	return FBConversation.upsert({
		pid: Conversation.participants.data[1].id,
		uid: Conversation.participants.data[0].id,
		pid_uid: Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id,
		t_mid: Conversation.id,
		psid: (psid ? psid : undefined),
		updated_time: Conversation.updated_time,
		link: Conversation.link,
		name: Conversation.participants.data[0].name,
		snippet:	Conversation.snippet,
		message_count: Conversation.message_count,
		unread_count: Conversation.unread_count,
		replied_last_by:replied_last_by ? replied_last_by : undefined,
		replied_last_time:replied_last_by ? moment().utcOffset(0).format('YYYY-MM-DD HH:mm:ss') : undefined,
		customer_replied:Conversation.messages.data[0].from.id === Conversation.participants.data[0].id,
		customer_replied_time:(Conversation.messages.data[0].from.id === Conversation.participants.data[0].id ? Conversation.updated_time : undefined)
	},{
		where: {
			t_mid: Conversation.id,
		},
	}).then(sequelizeHandler);
}

function upsertConversations(Conversations){
	return Promise.mapSeries(Conversations,function(Conversation,i){
		return upsertConversation(Conversation,undefined);
	}).then(sequelizeHandler);
}

function destroyConversationLabel(t_mid,label_id){
	return FBConversationLabel.destroy({
		where:{
			t_mid:t_mid,
			label_id:label_id
		},
		force:true
	}).then(x=>sequelizeHandler(x,{t_mid:t_mid,label_id:label_id},'FBConversationLabel.destroy returned no results'));
}

function findAllProduct(){
	return Product.scope('admin').findAll()
	.then(x=>sequelizeHandler(x,{},'Product.findAll returned no results'));
}

function getTMID(PAGE_ACCESS_TOKEN,m_mid,psid,pid,upsert_missing=true){
	var r = {};

	console.log('2 ======================== 1 FBConversation.findOne(psid) =========================');
	return FBConversation.findOne({
		where : {psid:psid}
	}).then(x=>sequelizeAllowEmptyHandler(x))
	.then(function(Instance){
		if(Instance){
			console.log('2 ======================== 2.A* return t_mid =========================');
			r.FBConversation = Instance;
			r.t_mid = r.FBConversation.t_mid;
			return r.t_mid;//1ST RETURN CONDITION
		}else{
			console.log('2 ======================== 2.B getMessage =========================');
			return getMessage(PAGE_ACCESS_TOKEN,m_mid)
			.then(function(response){
				if(response.id){
					r.Message = response;
					if(r.Message.from.id === pid){
						r.uid = r.Message.to.data[0].id;
					}else{
						r.uid = r.Message.from.id;
					}
					console.log('2 ======================== 2.B2 FBConversation.findOne(pid,uid) =========================');					
					return FBConversation.findOne({
						where : {pid:pid,uid:r.uid}
					}).then(x=>sequelizeAllowEmptyHandler(x))
					.then(function(Instance){
						if(Instance){
							console.log('2 ======================== 2.B3.A* return t_mid =========================');					
							r.FBConversation = Instance;
							r.t_mid = r.FBConversation.t_mid;
							return r.t_mid;//2ND RETURN CONDITION
						}else{
							console.log('2 ======================== 2.B3.B getConversations(pid) =========================');					
							return getConversations(
										PAGE_ACCESS_TOKEN,
										pid,
										{	limit:100,
											total_count:null,
											matchFunc:((x,i)=>{
												console.log(parseInt(x.participants.data[0].id,10)+'='+parseInt(r.uid,10));
												if(parseInt(x.participants.data[0].id,10) === parseInt(r.uid,10)){
													return true;
												}else{
													return false;
												}
											})
										}
									)
							.then(function(Conversations_){
								if(Conversations_ && Conversations_.length >=1){
									r.Conversations = Conversations_;
									var Conversations = Conversations_;
									var index = Conversations.findIndex((Conversation,i)=>(
										(Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id) === pid+'_'+r.uid
									));
									if(index !== -1){
										console.log('2 ======================== 2.B3.B2.A* return t_mid =========================');					
										r.Conversation = Conversations[index];
										r.t_mid = r.Conversation.id;
										return r.t_mid;
									}else{
										throw new Error(JSON.stringify({message:'The Conversation is not found in the top 25 on the list',data:{m_mid:m_mid,psid:psid,uid:r.uid}}));
									}
								}else{
									throw new FBGraphAPINoResultError(JSON.stringify({message:'FBGraphAPINoResultError',data:{f:'getConversations',pid:r.pid}}));
								}
							}).then(function(t_mid){
								if(upsert_missing === true){
									return upsertConversations(r.Conversations);
								}
							}).then(function(is_inserts){
								return r.t_mid; //3RD RETURN CONDITION
							});
						}
					});
				}else{
					throw new FBGraphAPINoResultError(JSON.stringify({message:'FBGraphAPINoResultError',data:{f:'getMessage',m_mid:m_mid}}));
				}
			})
		}
	})

}

function getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN,t_mid,m_mid,event=undefined,psid=undefined,id_employee=undefined){
	var r = {};

	return getMessage(PAGE_ACCESS_TOKEN, m_mid)
	.then(function(response){
		if(response){
			r.Message = response;
			return getConversation(PAGE_ACCESS_TOKEN, t_mid);
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({data:{t_mid:t_mid,m_mid:m_mid}}));
		}
	}).then(function(response){
		if(response){
			r.Conversation = response;
			if(r.Message && (event && event.message || event && event.delivery || !event) ){
				return upsertMessage(t_mid,[r.Message],event,id_employee);
			}else{
				throw new Error(JSON.stringify({message:'unknown messaging event',data:{t_mid,t_mid,m_mid:m_mid}}));
			}
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({data:{t_mid:t_mid,m_mid:m_mid}}));
		}
	}).then(function(is_insert){
		return upsertConversation(r.Conversation, (psid ? psid : undefined),(id_employee ? id_employee : undefined));
	}).then(function(is_insert){
		return findOneMessage(m_mid);
	}).then(function(Instance){
		r.FBMessage = Instance;
		return findOneConversation(t_mid);
	}).then(function(Instance){
		r.FBConversation = Instance;
		return r;
	});
}

function getAndUpsertConversation(PAGE_ACCESS_TOKEN,t_mid,psid,Conversation=undefined){
	var r = {};

	return getConversation(PAGE_ACCESS_TOKEN, t_mid)
	.then(function(response){
		if(response){
			Conversation = response;
			return upsertConversation(Conversation,psid);
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({data:{t_mid:t_mid,psid:psid}}));
		}
	}).then(function(is_insert){
		return findOneConversation(t_mid);
	}).then(function(Instance){
		r.FBConversation = Instance;
		return r;
	});
}

function getAndUpsertMessages(PAGE_ACCESS_TOKEN,pid,t_mid,options={}){
	var total_count = typeof options.total_count !== undefined  ? options.total_count : undefined;
	var limit = typeof options.limit !== undefined ? options.limit : 100;

	var r = {};
	return Promise.all([
		getMessages(PAGE_ACCESS_TOKEN,t_mid,{limit:limit,total_count:total_count,matchFunc:((x,i)=>(false))}),
		findAllMessages(t_mid)
	]).spread(function(Messages,Instances){
		if(Messages && Messages.length>=1){
			r.Messages = Messages;
			if(Instances && Instances.length >= 1){
				r.FBMessages = Instances;
			}else{
				r.FBMessages = [];
			}
			
			var MessagesNew = [];
			r.Messages.map((Message,i)=>{
				var index = r.FBMessages.findIndex((x,i)=>(x.m_mid === Message.id));
				if(index === -1){
					MessagesNew.push(Message);
				}else{
					MessagesNew.push(Message);
				}
			});
			
			return upsertMessages(t_mid,MessagesNew);
		}else{
			throw new FBGraphAPINoResultError(JSON.stringify({data:{pid:pid,t_mid:t_mid,options:options}}));
		}
	}).then(function(is_inserts){
		return findAllMessages(t_mid,{limit:total_count});
	}).then(function(Instances){
		r.FBMessages = Instances;
		return r;
	});
}

function createConversationProduct(t_mid,id_product,comment_id,post_id,id_employee){
	return FBConversationProduct.create({
		t_mid_id_product:t_mid+'_'+id_product,
		t_mid:t_mid,
		id_product:id_product,
		comment_id:comment_id ? comment_id : undefined,
		post_id:post_id ? post_id : undefined,
		id_employee:id_employee ? id_employee : undefined
	}).then(x=>sequelizeHandler(x,{t_mid:t_mid,id_product:id_product,comment_id:comment_id,post_id:post_id,id_employee:id_employee},'FBConversationProduct.create failed'));
}

function deleteConversationProduct(t_mid,id_product,id_employee){
	return FBConversationProduct.destroy({
		where:{
			t_mid:t_mid,
			id_product:id_product
		}
	}).then(x=>sequelizeHandler(x,{t_mid:t_mid,id_product:id_product},'FBConversationProduct.destroy failed'));
}

function syncLabels(PAGE_ACCESS_TOKEN, pid){
	var r = {};
	return FBLabel.findAll({where:{pid:pid}})
	.then(x=>sequelizeHandler(x,{pid:pid},'FBLabel.findAll returned no results'))
	.then(function(Instances){
		var label_ids = Instances.map((x,i)=>(x.label_id));
		console.log('FBLabel.findAll({where:{pid:pid}}).length'+Instances.length);
		return Promise.all([
			FBLabel.destroy({
				where: {pid: pid}
			}).then(x=>sequelizeHandler(x,{pid:pid},'FBLabel.destroy returned no results')),
			FBConversationLabel.destroy({
				where: {label_id: {$in:label_ids}}
			}).then(x=>sequelizeHandler(x,{label_ids:label_ids},'FBConversationLabel.destroy returned no results'))
		]);
	}).spread(function(rows_deleted,rows_deleted2){
		return getPageLabels(PAGE_ACCESS_TOKEN,{limit:100});
	}).then(function(Labels){
		if(Labels && Labels.length>=1){
			r.Labels = Labels;
			var batch = [];
			Labels.map((Label,i)=>{
				batch[i] = {method:'GET',relative_url:Label.id+'?fields=users{labels,name}'};
			});
		}else{
			throw new Error('getPageLabels returns empty result');
		}
		return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch);
	}).then(function(data){
		if(data && data.length >= 1){
			var users = [];
			data.map((label,i)=>{
				var body = JSON.parse(label.body);
				if(body.users && body.users.data.length >= 1){
					users = users.concat(body.users.data);
				}
			});
			console.log('users.length='+users.length);

			var unique_users = unique2DArray(users,'id');
			r.unique_users = unique_users;

			console.log('unique_users.length='+unique_users.length);

			return Promise.mapSeries(r.Labels,(Label,i)=>{
				FBLabel.upsert({
					label_id:Label.id,
					name:Label.name,
					pid:pid
				},{where:{label_id:Label.id}})
				.then(x=>sequelizeHandler(x,{label_id:label_id,pid:pid},'FBLabel.upsert returned no results'))
			});
		}else{
			throw new Error('fbAPIRequestBatcher returns empty result');
		}
	}).then(function(Labels){
		console.log('Labels.length='+Labels.length)
		return Promise.mapSeries(r.unique_users,(User,i)=>{
			//console.log('User.i='+i+' User.id='+User.id);
			return FBConversation.findOne({
				where:{uid:User.id}
			}).then(x=>sequelizeHandler(x,{uid:User.id},'FBConversation.findOne returned no results'))
			.then(function(fbconversation){
				if(fbconversation && fbconversation.t_mid){
					var FBConversationLabels = Promise.mapSeries(User.labels,(Label,i)=>{
						console.log('UserLabels.i='+i+' Labels.id='+Label.id);
						return FBConversationLabel.create({
							t_mid_label_id:fbconversation.t_mid+'_'+Label.id,
							label_id:Label.id,
							t_mid:fbconversation.t_mid
						}).then(x=>sequelizeHandler(x,{t_mid:fbconversation.t_mid,label_id:Label.id},'FBConversationLabel.create returned no results'));
					});
					return FBConversationLabels;
				}else{
					// JUST SKIP IF CANNOT FIND
				}
			});
		});
	});

}

function deleteReadings(readings,id_employee,socket_id,t_mid){
	if(typeof t_mid === 'undefined' && typeof socket_id === 'undefined'){
		readings = readings.filter((reading,i)=>{
			if(reading.id_employee === id_employee){
				return false;
			}
			return true;
		});
	}else if(typeof t_mid === 'undefined'){
		readings = readings.filter((reading,i)=>{
			if(reading.socket_id === socket_id){
				return false;
			}
			return true;
		});
	}else{
		readings = readings.filter((reading,i)=>{
			if(reading.id_employee === id_employee && reading.socket_id === socket_id && reading.t_mid === t_mid){
				return false;
			}
			return true;
		});
	}
	return readings;
}

function toMMID(id){
	var prefix = id.substring(0,3);
	if(prefix === 'mid'){
		return 'm_'+id;
	}else if(prefix === 'm_m'){
		return id;
	}
	return id;
}

function sequelizeHandler(Instance,request_params,no_result_message){
	//findOne || create success
	if(Instance instanceof Sequelize.Instance){
		return Instance;
	}
	//findOne fail
	if(typeof Instance === 'object' && !Instance){
		if(typeof request_params === 'undefined'){
			return Instance;
		}else{
			throw new SequelizeNoResultError(JSON.stringify({message:no_result_message,q:request_params}));
		}
	}
	//findAll success
	if(Instance instanceof Array && Instance.length >= 1 && Instance[0] instanceof Sequelize.Instance){
		return Instance;
	}
	//findAll fail
	if(Instance instanceof Array && Instance.length === 0){
		if(typeof request_params === 'undefined'){
			return Instance;
		}else{
			throw new SequelizeNoResultError(JSON.stringify({message:no_result_message,q:request_params}));
		}
	}
	//upsert insert success
	if(typeof Instance === 'boolean' && Instance === true){ //for destroy and upsert
		return Instance;
	}
	//upsert update success
	if(typeof Instance === 'boolean' && Instance === false){ //for destroy and upsert
		return Instance;
	}
	//destroy success
	if(typeof Instance === 'number' && Instance >= 1){
		return Instance;
	}
	//destroy fail
	if(typeof Instance === 'number' && Instance === 0){
		if(typeof request_params === 'undefined'){
			return Instance;
		}else{
			throw new SequelizeNoResultError(JSON.stringify({message:no_result_message,q:request_params}));
		}
	}
	throw new SequelizeError(JSON.stringify({message:'Unexpected results returned by sequelize query',Instance:Instance}));
}

function sequelizeAllowEmptyHandler(Instance){
	return sequelizeHandler(Instance,undefined,undefined);
}

function facebookGraphAPIHandler(response){
	if(response.success || (response.data && response.data.length >= 1)  || response.id){
		return response;
	}else if(response.message_id || response.recipient_id){
		return response;
	}else if(response.data && response.data.length === 0){
		return response;
	}else if(response.attachment_id){
		return response;
	}else if(response.error){
		throw new FBGraphAPIStandardError(response.error.message);
	}else{
		throw new FBGraphAPIError(JSON.stringify(response));
	}
}

function catchHandler(err,res,socket){
	if(err instanceof Error){
		winston.error(err.stack,err.message);
		
		if(typeof res === 'object' && res){
			res.send({success:false,message:err.message});
		}else if(typeof socket === 'object' && socket){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		}
	}else{
		winston.error('UnknownError',err);
		if(typeof res === 'object' && res){
			res.send({success:false,error:err});
		}else if(typeof socket === 'object' && socket){
			socket.emit('ERROR', {
				error:'UnknownError',
				message:JSON.stringify(err),
			});
		}
	}
}

};
