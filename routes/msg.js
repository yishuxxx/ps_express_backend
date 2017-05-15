module.exports = function Msg(express, request, rq, crypto, settings, Sequelize, sequelize, io, winston) {
let router = express.Router();
let moment = require('moment');
let {randomString,unique2DArray} = require('../src/Utils/Helper');
let {FBGraphAPIStandardError, FBGraphAPIError, FBGraphAPINoResultError, SequelizeError, SequelizeNoResultError} = require('../src/Utils/Error');
var fs = require('fs');

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
let {FBCommentFunc} = require('../src/models/FBComment');
let FBComment = FBCommentFunc(Sequelize, sequelize);
let {FBConversationFunc} = require('../src/models/FBConversation');
let FBConversation = FBConversationFunc(Sequelize, sequelize);
let {FBPageFunc} = require('../src/models/FBPage');
let FBPage = FBPageFunc(Sequelize, sequelize);
let {FBAttachmentFunc} = require('../src/models/FBAttachment');
let FBAttachment = FBAttachmentFunc(Sequelize, sequelize);
let {FBLabelFunc} = require('../src/models/FBLabel');
let FBLabel = FBLabelFunc(Sequelize, sequelize);
let {FBConversationLabelFunc} = require('../src/models/FBConversationLabel');
let FBConversationLabel = FBConversationLabelFunc(Sequelize, sequelize);
let {FBUploadFunc} = require('../src/models/FBUpload');
let FBUpload = FBUploadFunc(Sequelize, sequelize);
let {FBSReplyFunc} = require('../src/models/FBSReply');
let FBSReply = FBSReplyFunc(Sequelize, sequelize);

FBConversation.hasMany(FBMessage, {foreignKey:'t_mid'});
FBMessage.belongsTo(FBConversation, {foreignKey:'t_mid'});
FBMessage.hasMany(FBAttachment, {foreignKey:'m_mid'});
FBMessage.belongsTo(Employee, {foreignKey:'id_employee'});
FBAttachment.belongsTo(FBMessage, {foreignKey:'m_mid'});
FBLabel.belongsToMany(FBConversation, {through:FBConversationLabel, foreignKey:'label_id', otherKey:'t_mid'});
FBConversation.belongsToMany(FBLabel, {through:FBConversationLabel, foreignKey:'t_mid', otherKey:'label_id'});

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

let numUsers = 0;
//io.set('transports', ['websocket']);
io.on('connection', function(socket) {
	console.log('connected to socket client');
	console.log(socket.request.user);
	socket.emit('GET_ME',socket.request.user);

	socket.on('GET_EMPLOYEES', function(data) {
		console.log('======================== socket.on(GET_EMPLOYEES) =========================');
		(()=>{
			return Employee.scope('messenger').findAll()
			.then(sequelizeHandler);
		})()
		.then(function(Instances){
			if(Instances){
				console.log('======================== socket.emit(GET_EMPLOYEES) =========================');
				socket.emit('GET_EMPLOYEES', {
					Employees:Instances
				});
			}else{
				winston.error('SequelizeNoResultError',{message:'No Employees Available'});
				throw new SequelizeNoResultError('No Employees Available');
			}
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		});
	});

	socket.on('GET_UPLOADS', function(data) {
		console.log('======================== socket.on(GET_UPLOADS) =========================');

		(()=>{
			return FBUpload.findAll()
			.then(sequelizeHandler);
		})()
		.then(function(Instances){
			if(Instances){
				console.log('======================== socket.emit(GET_EMPLOYEES) =========================');
				socket.emit('ADD_FILES', {
					FBUploads:Instances
				});
			}else{
				winston.error('SequelizeNoResultError',{message:'No Files Available'});
				throw new SequelizeNoResultError('No Files Available');
			}
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		});
	});

	socket.on('GET_LABELS', function(data) {
		console.log('======================== socket.on(GET_LABELS) START =========================');
		var q = {pid:data.pid};

		(()=>{
			return FBLabel.findAll({
				where:{pid:q.pid}
			}).then(sequelizeHandler)
			.catch(sequelizeErrorHandler);
		})()
		.then(function(Instances){
			if(Instances){
				console.log('======================== socket.on(GET_LABELS) END =========================');
				socket.emit('GET_LABELS', {
					data:Instances,
					pid:q.pid
				});
			}else{
				socket.emit('ERROR', {
					error:Instances.name,
					message:Instances.message,
				});
			}
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		});
	});

	socket.on('UPDATE_CONVERSATION_LABELS', function(data) {
		console.log('======================== socket.on(UPDATE_CONVERSATION_LABELS) START =========================');

		var r = {
			pid:data.pid,
			t_mid:data.t_mid,
			labels:data.labels
		};
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[r.pid];

		findOneConversation(r.t_mid)
		.then(function(Instance){
			if(Instance){
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
					return Sequelize.Promise.all(promises);					
				}
			}else{
				winston.error('SequelizeNoResultError',{f:'findOneConversation',t_mid:r.t_mid});
				throw new SequelizeNoResultError('findOneConversation');
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
						}).then(sequelizeHandler)
						.catch(sequelizeErrorHandler)
					);

					promises.push(postPageLabel(PAGE_ACCESS_TOKEN,r.FBConversation.uid,label.value));
				}
			});
			return Sequelize.Promise.all(promises);

		}).then(function(promise_all_result){
			return findOneConversation(r.t_mid);
		}).then(function(Conversation){
			io.local.emit('new message', {
				Conversation:Conversation,
				pid:r.pid
			});
			console.log('======================== socket.on(UPDATE_CONVERSATION_LABELS) END =========================');
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		})
		
	});

	socket.on('SYNC_LABELS', function(data) {
		var pid = data.pid;

		syncLabels(PAGE_ACCESS_TOKEN_LONG[pid], pid)
		.then(function(nested){
			socket.emit('SYNC_LABELS',{success:true,length:nested.length});
		});
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

		(()=>{
			return FBConversation.findOne({
				where: {t_mid: q.t_mid},
			}).then(sequelizeHandler);	
		})()
		.then(function(Instance) {
			if(Instance) {
				r.FBConversation = Instance;
				r.psid = r.FBConversation.psid ? r.FBConversation.psid : undefined;
				r.FBConversation.engage_by = q.id_employee;
				r.FBConversation.engage_time = moment().utcOffset(0).format('YYYY-MM-DD HH:mm:ss');
				return r.FBConversation.save();
			}else{
				winston.error('SequelizeNoResultError',{message:'Cannot engage conversation that is not in database'});
				throw new SequelizeNoResultError('Cannot engage conversation that is not in database');
			}
		}).then(function(Instance){
			if(Instance){
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
					psid:(r.psid ? r.psid : null),
					id_employee:q.id_employee
				});
			}else{
				winston.error('SequelizeNoResultError',{message:'Cannot engage conversation that is not in database'});
				throw new SequelizeNoResultError('Cannot engage conversation that is not in database');
			}
		}).then(function(r2){
			io.local.emit('new message', {
				pid:q.pid,
				Conversation:r2.FBConversation,
				Message:r2.FBMessage
			});
			console.log('======================== socket.on(new message) END =========================');
		}).catch(function(err){
			if(err instanceof Error){
				io.local.emit('ERROR',{
					error:err.name,
					message:err.message
				});
			}
			throw err;
		})
	});

	socket.on('DELETE_ENGAGES', function(data) {
		console.log('======================== socket.on(DELETE_ENGAGES) =========================');		
		var q = {
			id_employee:data.id_employee
		};
		var r = {};

		console.log('======================== FBConversation.findAll =========================');		
		console.log(q);
		(()=>{
			return FBConversation.findAll({
				where: {engage_by: q.id_employee},
			}).then(sequelizeHandler);	
		})()
		.then(function(Instances) {
			if(Instances) {
				console.log('======================== FBConversation.save x N =========================');		
				console.log(Instances.length);
				r.FBConversations = Instances;
				return Sequelize.Promise.mapSeries(r.FBConversations,function(FBConversation,i){
					FBConversation.engage_by = null;
					FBConversation.engage_time = null;
					return FBConversation.save();
				});
			}else{
				//JUST SKIP IF NO ENGAGES
			}
		}).then(function(unknown){
			io.local.emit('DELETE_ENGAGES', {
				Conversations:r.FBConversations,
			});
			console.log('======================== socket.emit(DELETE_ENGAGES) =========================');
		}).catch(function(err){
			if(err instanceof Error){
				io.local.emit('ERROR',{
					error:err.name,
					message:err.message
				});
			}
			throw err;
		})
	});



	socket.on('SYNC_CONVERSATIONS',function(data){

		let pid = data.pid;
		let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
		let last_message_date = moment(data.last_message_date);
		let result = {};

		var count_conv = 0;
		var count_msg = 0;

		new Sequelize.Promise(function(resolve, reject) {
			let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
			let qs = {
				access_token: PAGE_ACCESS_TOKEN,
				fields: 'link,id,message_count,snippet,updated_time,unread_count,participants',
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
			return Sequelize.Promise.mapSeries(r.data,function(Conversation){
				return FBConversation.upsert({
						pid: Conversation.participants.data[1].id,
						uid: Conversation.participants.data[0].id,
						pid_uid: Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id,
						t_mid: Conversation.id,
						psid: null,
						updated_time: Conversation.updated_time,
						link: Conversation.link,
						name: Conversation.participants.data[0].name,
						snippet:	Conversation.snippet,
						message_count: Conversation.message_count,
						unread_count: Conversation.unread_count,
					}, {
						where: {
							t_mid: Conversation.id,
						},
					}
				)
			});
		}).then(function(Instances){
			socket.emit('SYNC_CONVERSATIONS',{success: true});
		}).catch(function(err){
			if(err instanceof Error){
				winston.error(err.err.name,{error:err});
				socket.emit('ERROR',{error:err.name,message: err.message});
			}
		});


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
		var where = {pid:q.pid};
		var include = undefined;
		if(q.before){
			where.updated_time = {$lt:q.before};
		}
		if(q.inbox && q.inbox === 'UNREAD'){
			where.unread_count = {$gt:0};
		}
		if(q.label_ids && q.label_ids.length >=1){
			/*
			var where_labels = {};
			where_labels.label_id = {$in:q.label_ids};
			*/
			if(!(include instanceof Array)){
				include = [];
			}
			include.push({
				model:FBLabel,
				where:{
					label_id:{$in:q.label_ids}
				}
			});

		}
		if(q.engage_by){
			where.engage_by = q.engage_by;
		}
		if(q.name){
			where.name = {$like:'%'+q.name+'%'};
		}
		if(q.message){
			if(!(include instanceof Array)){
				include = [];
			}
			include.push({
				model:FBMessage,
				where:{
					message:{$like:'%'+q.message+'%'}
				}
			});
		}

		var condition = {
			where:where,
			order:[['updated_time','DESC']],
			limit:q.limit
		};
		if(include && include.length >=1){
			condition.include = include;
		}

		console.log(condition);


		return FBConversation.findAll(condition)
		.then(sequelizeHandler)
		.then(function(Instances){
			console.log('$$$ what happened inside here');
			console.log(Instances);
			if(Instances){
				console.log(Instances.length);
				r.FBConversations = Instances;
				var t_mids = r.FBConversations.map((FBConversation,i)=>(FBConversation.t_mid));
				return FBConversation.findAll({
					where:{t_mid:{$in:t_mids}},
					include:[{
						model:FBLabel
					}/*,{
						model:FBMessage,
						include:[{
							model:FBAttachment
						},{
							model:Employee.scope('messenger')
						}]
					}*/
					],
					order:[['updated_time','DESC']],
				}).then(sequelizeHandler);
			}else{
				console.log('$$$ WHY DO NOT GO INSIDE THIS THROW');
				winston.error('SequelizeNoResultError',{f:'FBConversation.findAll',pid:q.pid,message:'Conversation you search for is not found'});				
				throw new SequelizeNoResultError('Conversation you search for is not found');
			}
		}).then(function(Instances){
			if(Instances){
				r.FBConversations = Instances;
				r.FBConversations.map((FBConversation,i)=>{
					r.FBConversations[i] = r.FBConversations[i].get({plain:true});
					if(r.FBConversations[i].messages){
						r.FBConversations[i].FBMessages = null;
						r.FBConversations[i].messages = {data:r.FBConversations[i].messages.data.slice(0,25)};
					}
				});
				socket.emit('GET_CONVERSATIONS', {
					pid:q.pid,
					data:r.FBConversations
				});
				console.log('======================== socket.on(GET_CONVERSATIONS) END =========================');				
			}else{
				winston.error('SequelizeNoResultError',{f:'FBConversation.findAll',pid:q.pid});				
				throw new SequelizeNoResultError('FBConversation.findAll');
			}
		}).catch(function(err){
			console.log('$$$ INSIDE CATCH');
			if(err instanceof SequelizeNoResultError){
				console.log('$$$ IS ERR');
				socket.emit('NO_DATA', {
					error:err.name,
					message:'No Conversations matches the filter'
				});
			}else{
				socket.emit('ERROR', {
					error:err.name,
					message:err.message,
				});
				winston.error('SequelizeNoResultError',{error:err});				
				throw err;
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
		new Sequelize.Promise(function(resolve, reject) {
			if(q.latest_only === true){
				findAllMessages(q.t_mid,{limit:25})
				.then(function(Instances){
					if(Instances){
						r.FBMessages = Instances;
						socket.emit('GET_MESSAGES', {
							pid:q.pid,
							Messages:r.FBMessages
						});
					}
					resolve();
				});
			}else{
				resolve();
			}
		}).then(function(Instances){
			console.log('======================== 2 getAndUpsertMessages =========================');				
			return getAndUpsertMessages(PAGE_ACCESS_TOKEN_LONG[q.pid],q.pid,q.t_mid,{total_count:(q.latest_only ? 99 : null) });
		}).then(function(result){
			if(result && result.FBMessages && result.FBMessages.length>=1){
				console.log('======================== 3 socket.emit(GET_MESSAGES) =========================');
				r.FBMessages = result.FBMessages;
				socket.emit('GET_MESSAGES', {
					pid:q.pid,
					Messages:r.FBMessages
				});
			}else{
				socket.emit('ERROR', {
					error:'No More Messages',
					message:'No more messages to retreieve'
				});
			}
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message
			});
			throw err;
		})

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
		
		Sequelize.Promise.all(p)
		.spread(function(Instances,Conversations_){
			if(Instances && Conversations_){
				console.log('======================== 2 find ConversationsToUpdate =========================');		
				var FBConversations = Instances;			
				var Conversations = Conversations_;
				var ConversationsToUpdate = [];
				var p = [];

				Conversations.map((Conversation,i)=>{
					var FBConversation = FBConversations.find((x,i)=>(x.t_mid === Conversation.id));

					//console.log(moment(Conversation.updated_time).format('YYYY-MM-DD HH:mm:ss')+'  -  '+moment(FBConversation.updated_time).format('YYYY-MM-DD HH:mm:ss'));
					//console.log(time_diff);
					if(FBConversation){
						var time_diff = moment(Conversation.updated_time).diff(moment(FBConversation.updated_time));
						if(time_diff > 0){
							Conversation.t_mid = Conversation.id;
							ConversationsToUpdate.push(Conversation);
						}else if(time_diff === 0){
							//DO NOTHING
						}else{
							winston.error('REFRESH_CONVERSATIONS, time_diff is negative');
							throw new Error('REFRESH_CONVERSATIONS, time_diff is negative');
						}
					}else if(typeof FBConversation === 'undefined'){
						Conversation.t_mid = Conversation.id;
						ConversationsToUpdate.push(Conversation);
					}else{
						winston.error('REFRESH_CONVERSATIONS');
						throw new Error('REFRESH_CONVERSATIONS');
					}
				});

				console.log('======================== 3 upsertConversation * N =========================');		
				ConversationsToUpdate.map((Conversation,i)=>{
					p.push(upsertConversation(Conversation));
				});
				r.Conversations = ConversationsToUpdate;

				return Sequelize.Promise.all(p);
			}else{
				winston.error('Error',{f:'FBConversation.findAll || getConversations',pid:q.pid});
				throw new Error('FBConversation.findAll || getConversations')
			}
		}).then(function(unknown){
			console.log(unknown);
			console.log('======================== 4* socket.emit(REFRESH_CONVERSATIONS) =========================');
			console.log(r.Conversations.length);
			socket.emit('REFRESH_CONVERSATIONS',{
				pid:q.pid,
				Conversations:r.Conversations
			});
		});

	});

	let addedUser = false;
	// when the client emits 'new message', this listens and executes
	socket.on('new message', function(data) {
		console.log('======================== socket.on(new message) START =========================');
		console.log('EMPLOYEE='+socket.request.user.email);

		var r = data;
		console.log(r);

		(()=>{
			return FBConversation.findOne({
				where: {t_mid: r.t_mid},
			}).then(sequelizeHandler);		
		})()
		.then(function(Instance) {
			if(Instance) {
				r.FBConversation = Instance;
				console.log(r.FBConversation.psid);
				r.psid = r.FBConversation.psid ? r.FBConversation.psid : null;
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
					var url = settings.SERVER_URL + settings.base_dir+"/msg/media/"+r.filenames[0];
					message_data = {
						recipient: {
							id: r.psid,
						},
						message: {
							attachment: {
								type: "image",
								payload: {
									url: url
								}
							}
						},
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
				psid:(r.psid ? r.psid : null),
				id_employee:socket.request.user.id_employee
			});

		}).then(function(r2){
			io.local.emit('new message', {
				username: socket.username,
				Message:r2.FBMessage,
				Conversation:r2.FBConversation,
				pid:r.pid
			});
			console.log('======================== socket.on(new message) END =========================');
		}).catch(function(err){
			if(err instanceof Error){
				io.local.emit('ERROR',{
					error:err.name,
					message:err.message
				});
			}
			throw err;
		})
	});

	socket.on('ADD_FILES',function(data){
		console.log('======================== socket.on(ADD_FILE) =========================');
		var file_buffers = data.file_buffers;
		var file_infos = data.file_infos;

		file_buffers.map((file_buffer,i)=>{
			//var file_buffer = data.file_buffer[0];
			console.log('======================== FILE_BUFFER =========================');
			console.log(file_buffer);
			console.log(file_buffer.length);
			console.log(file_infos[0].name);
			console.log(file_infos.length);
			var file_info = file_infos[i];
			var length = file_info.name.length;
			file_info.filename = randomString('16','#a')+'.'+file_info.name.substring(length-3,length);
			var stream = fs.createWriteStream(BASEDIR_IMAGE+file_info.filename);
			stream.once('open', function(fd) {
			  stream.write(file_buffer);
			  stream.end();
			});
		});

		Sequelize.Promise.mapSeries(file_infos,function(file_info,i){
			return FBUpload.create({
				name:file_info.name,
				type:file_info.type,
				filename:file_info.filename,
				created_by:socket.request.user.id_employee
			});
		}).then(function(Instances){
			if(Instances){
				FBUploads = Instances;
				socket.emit('ADD_FILES',{FBUploads:FBUploads});
			}
		});
	});

	socket.on('DELETE_FILES',function(data){
		console.log('======================== socket.on(DELETE_FILES) =========================');
		var filenames = data.filenames;
		var filepaths = [];
		filenames.map((filename,i)=>{
			filepaths.push(BASEDIR_IMAGE+filename)
		});

		function unlinkFiles(filepaths){
			fs.unlink(filepaths[0], function(err){
			    if(err) {
			    	winston.error(err.name,{error:err});
			    	throw err;
			    } else {
			    	console.log('======================== '+filepaths[0]+' DELETED =========================');
					unlinkFiles(filepaths.shift());
			    }
			});
		}

		Sequelize.Promise.mapSeries(filenames,function(filename,i){
			return FBUpload.destroy({where:{filename:filename}});
		}).then(function(unknown){
			if(unknown){
				socket.emit('DELETE_FILES',{filenames:filenames});
			}
		});
	});

	socket.on('GET_SREPLIES',function(data){
		console.log('======================== socket.on(GET_SREPLIES) =========================');
		FBSReply.findAll()
		.then(function(Instances){
			if(Instances){
				socket.emit('GET_SREPLIES',{FBSReplies:Instances});
			}
		});
	});

	socket.on('ADD_SREPLY',function(data){
		console.log('======================== socket.on(ADD_SREPLY) =========================');
		var q = {
			title:data.title,
			message:data.message,
			filename:data.filename
		};

		FBSReply.create({
			title:q.title,
			message:q.message,
			upload_filename:q.filename,
			id_employee:socket.request.user.id_employee
		}).then(function(Instance){
			if(Instance){
				socket.emit('ADD_SREPLY',{FBSReply:Instance});
			}
		});
	});

	socket.on('DELETE_SREPLIES',function(data){
		console.log('======================== socket.on(DELETE_SREPLIES) =========================');
		var sreply_ids = data.sreply_ids;

		FBSReply.destroy({where:{sreply_id:{$in:sreply_ids}}})
		.then(function(unknown){
			if(unknown){
				socket.emit('DELETE_SREPLIES',{sreply_ids:sreply_ids});
			}
		});
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

router.get('/bulk2', function(req, res) {
	res.render('bulk_immutable');
});

router.get('/msger', function(req, res) {
	res.render('msger');
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

	Sequelize.Promise.all(promises)
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

		return Sequelize.Promise.all(promises);
	}).then(function(Bodys) {
		res.send({Bodys});
		let promises = [];

		FBPages.map((FBPage, i)=>{
			FBPage.access_token_long = Bodys[i].access_token;
			FBPage.expires_in = Bodys[i].expires_in;
			promises.push(FBPage.save());
		});
		return Sequelize.Promise.all(promises);
	}).then(function(Instances) {
		if(Instances) {
			Instances.map((Instance, i)=>{
				console.log('SAVED LONG LIVE TOKEN #'+i+' --- '+Instance.access_token_long);
			});
		}
	}).catch(function(err) {
		console.log(err);
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

	new Sequelize.Promise(function(resolve, reject) {
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
							t_mid: null,
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
			return Sequelize.Promise.all(promises);
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

router.get('/getconv', function(req, res) {
	let pid = req.query.pid;
	let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
	let last_message_date = moment(req.query.last_message_date);
	let result = {};

	var count_conv = 0;
	var count_msg = 0;

	new Sequelize.Promise(function(resolve, reject) {
			let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
			let qs = {
				access_token: PAGE_ACCESS_TOKEN,
				fields: 'link,id,message_count,snippet,updated_time,unread_count,participants,messages{message,id,created_time,from,to,attachments}',
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

		return Sequelize.Promise.mapSeries(r.data,function(Conversation){
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
					}, {
						where: {
							t_mid: Conversation.id,
						},
					}
				)
		});
	}).then(function(Instances) {

		return Sequelize.Promise.mapSeries(result.data,function(Conversation){
			count_conv = count_conv + 1;
			console.log(count_conv);
			return Sequelize.Promise.mapSeries(Conversation.messages.data,function(Message){
				count_msg = count_msg + 1;
				console.log(count_msg);

				return FBMessage.upsert({
					m_mid: Message.id,
					t_mid: Conversation.id,
					created_time: Message.created_time,
					uid_from: Message.from.id,
					uid_to: Message.to.data[0].id,
					message: Message.message,
					attachment_id: Message.attachments ? Message.attachments.data[0].id : undefined 
				},{
					where: {
						m_mid: Message.id,
					},
				}).then(function(FBMessage){
					if(FBMessage && Message.attachments && Message.attachments.data.length >= 1){
						var Attachments = Message.attachments.data;
						return Sequelize.Promise.mapSeries(Attachments,function(Attachment){
							return FBAttachment.upsert({
								attachment_id:Attachment.id,
								m_mid:Message.id,
								mime_type:Attachment.mime_type,
								name:Attachment.name,
								image_data:JSON.stringify(Attachment.image_data),
								file_url:Attachment.file_url,
								size:Attachment.size,
								video_data:JSON.stringify(Attachment.video_data)
							});
						});
					}
				})

			})
		});

	}).then(function(Instances){
		res.send({success: true, count_conv: count_conv, count_msg: count_msg});
	}).catch(function(err){
		console.log(err);
		res.send({success: false, message:err});
	});
});

router.get('/getconv2', function(req, res) {
	let pid = req.query.pid;
	let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
	let last_message_date = moment(req.query.last_message_date);
	let result = {};

	var count_conv = 0;
	var count_msg = 0;

	new Sequelize.Promise(function(resolve, reject) {
		let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
		let qs = {
			access_token: PAGE_ACCESS_TOKEN,
			fields: 'link,id,message_count,snippet,updated_time,unread_count,participants',
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
		return Sequelize.Promise.mapSeries(r.data,function(Conversation){
				return FBConversation.upsert({
						pid: Conversation.participants.data[1].id,
						uid: Conversation.participants.data[0].id,
						pid_uid: Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id,
						t_mid: Conversation.id,
						psid: null,
						updated_time: Conversation.updated_time,
						link: Conversation.link,
						name: Conversation.participants.data[0].name,
						snippet:	Conversation.snippet,
						message_count: Conversation.message_count,
						unread_count: Conversation.unread_count,
					}, {
						where: {
							t_mid: Conversation.id,
						},
					}
				)
		});
	}).then(function(Instances){
		res.send({success: true});
	}).catch(function(err){
		console.log(err);
		res.send({success: false, message:err});
	});
});

router.get('/labels',function(req,res){
	var pid = req.query.pid;
	syncLabels(PAGE_ACCESS_TOKEN_LONG[pid], pid)
	.then(function(nested){
		res.send({length:nested.length});
	});
});

router.get('/test',function(req,res){
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
						receivedAuthentication(messagingEvent);
					} else if (messagingEvent.message) {
						receivedMessage(messagingEvent);
					} else if (messagingEvent.delivery) {
						receivedDeliveryConfirmation(messagingEvent);
					} else if (messagingEvent.postback) {
						receivedPostback(messagingEvent);
					} else if (messagingEvent.read) {
						receivedMessageRead(messagingEvent);
					} else if (messagingEvent.account_linking) {
						receivedAccountLink(messagingEvent);
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

router.post('/pm', function(req, res) {
	res.send({success:true});
	/*	
	var pid = req.query.pid;
	var t_mid = req.query.t_mid;
	var m_mid = req.query.m_mid;
	var comment_id = req.query.comment_id;
	var r = {};
	
	if(!(pid && t_mid && m_mid && comment_id)){
		res.send({success:false});
		winston.error('RequestQueryParametersInvalidError',{route:'/pm',t_mid:t_mid,m_mid:m_mid,comment_id:comment_id});
		throw new RequestQueryParametersInvalidError('router.post(/pm)');
	}
	console.log('======================== PRIVATE REPLY =========================');
	getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[pid],t_mid,m_mid,null,null)
	.then(function(result){
		if(result.FBConversation){
			r.FBConversation = result.FBConversation;
		}
		if(result.FBMessage){
			r.FBMessage = result.FBMessage;
		}
		res.send({success:true});
		io.local.emit('new message', {Conversation:r.FBConversation,Message:r.FBMessage,pid:pid});
	}).catch(function(err){
		throw err;
	})
	*/
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

	Sequelize.Promise.all([
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

			return Sequelize.Promise.all([
				upsertConversation(r.Conversation),
				upsertMessages(q.t_mid,MessagesNew)
			]);
		}else{
			winston.error('FBGraphAPINoResultError',{f:'getConversation || getMessages',pid:q.pid,t_mid:q.t_mid});
			throw new FBGraphAPINoResultError('getConversation || getMessages');
		}
	}).spread(function(unknown,unknown){
		return Sequelize.Promise.all([
			findOneConversation(q.t_mid),
			findAllMessages(q.t_mid,{limit:5})
		]);
	}).spread(function(fbconversation,fbmessages){
		if(fbconversation && fbmessages){
			io.local.emit('new message',{
				pid:q.pid,
				Conversation:fbconversation,
				Messages:fbmessages
			});
		}else{
			winston.error('SequelizeNoResultError',{f:'findOneConversation || findAllMessages',t_mid:q.t_mid});
			throw new SequelizeNoResultError('findOneConversation || findAllMessages');
		}
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
			return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,event,event.sender.id,null);
		}else{
			throw new Error('getTMID');
		}
	}).then(function(result){
		if(result){
			r.FBConversation = result.FBConversation;
			r.FBMessage = result.FBMessage;
			console.log('======================== 3* io.local.emit(new message) START =========================');
			io.local.emit('new message', {Conversation:r.FBConversation,Message:r.FBMessage,pid:r.pid});
		}
	}).catch(function(err) {
		throw err;
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
					return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,event,event.sender.id,null);
				}else{
					winston.error('SequelizeNoResultError',{pid:r.pid,psid:r.psid,m_mid:r.m_mid});
					throw new SequelizeNoResultError('getTMID');
				}
			}).then(function(result){
				if(result){
					r.FBConversation = result.FBConversation;
					r.FBMessage = result.FBMessage;
					console.log('======================== 3* io.local.emit(new message) START =========================');
					io.local.emit('new message', {Conversation:r.FBConversation,Message:r.FBMessage,pid:r.pid});
				}
			}).catch(function(err) {
				winston.error('Error',{error:err});
				throw err;
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
	FBMessage.findAll({
		where: {
			timestamp: {$lte: event.read.watermark},
			psid_sender: event.sender.id,
			psid_recipient: event.recipient.id,
		},
	}).then(function(Instances) {
		console.log('========================FIND MSG (END)=========================');
		console.log('========================UPDATE MSG (START)=========================');
		r.FBMessages = Instances;
		if(r.FBMessages) {
			let queryList = [];
			r.FBMessages.map(function(FBMessage, index) {
				FBMessage.read_timestamp = event.timestamp;
				queryList.push(FBMessage.save());
			});
			return Sequelize.Promise.all(queryList);
		}
	}).catch(function(err) {
		console.log('========================UPDATE MSG READ (END)=========================');
		console.log(err);
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
function callSendAPI(message_data,action_type,conversation_info=null) {

	var r = conversation_info ? conversation_info : {};

	if(r.pid === undefined && r.t_mid === undefined){
		winston.error('Error',{f:'callSendAPI',pid:r.pid,t_mid:r.t_mid});
		throw new Error('Function Parameter is undefined');
	}

	return new Sequelize.Promise(function(resolve,reject){
		if(r.psid){
			console.log('======================== postMessageByPSID =========================');
			postMessageByPSID(PAGE_ACCESS_TOKEN_MESSENGER[r.pid],message_data)
			.then(function(response){
				if(response.message_id){
					r.m_mid = toMMID(response.message_id);
					resolve('m_mid');
				}else if(response.recipient_id){
					r.psid = response.recipient_id;
					resolve('psid');
				}
			});
		}else{
			if(action_type === 'text'){
				console.log('======================== postMessageByTMID =========================');
				postMessageByTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,message_data.message.text)
				.then(function(response){
					if(response.id){
						r.m_mid = response.id;
						resolve('m_mid');
					}else{
						winston.error('FBGraphAPINoResultError',{t_mid:r.t_mid});
						throw new FBGraphAPINoResultError('postMessageByTMID');
					}
				});
			}else{
				winston.error('PSIDRequiredError',{t_mid:r.t_mid});
				throw new Error('PSID is required for this action type');
			}
		}
	}).then(function(type){
		if(type){
			if(type === 'm_mid'){
				console.log('======================== getAndUpsertMessageConversation =========================');
				return getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.m_mid,null,(r.psid?r.psid:null),(r.id_employee?r.id_employee:null));
			}else if(type === 'psid'){
				console.log('======================== getAndUpsertConversation =========================');
				return getAndUpsertConversation(PAGE_ACCESS_TOKEN_LONG[r.pid],r.t_mid,r.psid);
			}
		}else{
			winston.error('FBGraphAPINoResultError',{t_mid:r.t_mid,psid:r.psid});
			throw new FBGraphAPINoResultError('postMessageByPSID || postMessageByTMID');
		}
	}).then(function(result) {
		if(result){
			if(result.FBConversation){
				r.FBConversation = result.FBConversation;
			}
			if(result.FBMessage){
				r.FBMessage = result.FBMessage;
			}
			return r;
		}else{
			winston.error('SequelizeNoResultError',{t_mid:r.t_mid,psid:r.psid});
			throw new SequelizeNoResultError('SequelizeNoResultError');
		}
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
			fields: 'id,snippet,updated_time,message_count,unread_count,link,participants'
		},
		method:'GET',
		json:true
	}).then(facebookGraphAPIHandler)
	.then(function(response){
		return response;
	});
}

function getConversations2(PAGE_ACCESS_TOKEN, pid,options={}){
	let last_message_date = options.last_message_date_input ? moment(options.last_message_date_input) : moment();
	let limit = options.limit !== undefined ? options.limit : 100;
	let fields = options.fields !== undefined ? options.fields : 'link,id,message_count,snippet,updated_time,unread_count,participants,messages{message,id,created_time,from,to,attachments}';

	let result = {};

	return new Sequelize.Promise(function(resolve, reject) {
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

	return new Sequelize.Promise(function(resolve, reject) {
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

	return new Sequelize.Promise(function(resolve, reject) {
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
	}).catch(function(err){
		throw err;
	});
}

function fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,requests){

	var batches = [];
	while(requests.length > 0){
		batches.push(JSON.stringify(requests.splice(0,50)));
	}

	return Sequelize.Promise.mapSeries(batches,(batch,i)=>{
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
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);
}

function findAllMessages(t_mid,options={}){
	var limit = (options.limit !== undefined) ? options.limit : null;
	var before = (options.before !== undefined) ? options.before : null;
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
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);
}

function upsertMessages(t_mid,Messages){
	return Sequelize.Promise.mapSeries(Messages,(Message,i)=>{
		return FBMessage.upsert({
			m_mid: Message.id,
			t_mid: t_mid,
			created_time: Message.created_time,
			uid_from: Message.from.id,
			uid_to: Message.to.data[0].id,
			message: Message.message,
			attachment_id: Message.attachments ? Message.attachments.data[0].id : null 
		},{
			where: {m_mid: Message.id}
		}).then(sequelizeHandler)
		.then(function(FBMessage){
			console.log(FBMessage);
			//IMAGES, VIDEO, AUDIO FROM PAGE & USER
			if(Message.attachments && Message.attachments.data.length >= 1){
				var Attachments = Message.attachments.data;
				return Sequelize.Promise.mapSeries(Attachments,function(Attachment){
					return FBAttachment.upsert({
						attachment_id:Attachment.id,
						m_mid:Message.id,
						mime_type:Attachment.mime_type,
						name:Attachment.name,
						image_data:JSON.stringify(Attachment.image_data),
						file_url:Attachment.file_url,
						size:Attachment.size,
						video_data:JSON.stringify(Attachment.video_data)
					},{
						where:{attachment_id:Attachment.id}
					}).then(sequelizeHandler);
				});
			}
		}).catch(sequelizeErrorHandler);
	});
}

function upsertMessage(t_mid,Messages,event,id_employee){
	return Sequelize.Promise.mapSeries(Messages,(Message,i)=>{
		return FBMessage.upsert({
			m_mid: Message.id,
			t_mid: t_mid,
			created_time: Message.created_time,
			uid_from: Message.from.id,
			uid_to: Message.to.data[0].id,
			message: Message.message,
			attachment_id: Message.attachments ? Message.attachments.data[0].id : null,
			delivery_timestamp: (event && event.delivery) ? event.timestamp : null,
			read_timestamp: (event && event.read) ? event.timestamp : null,
			id_employee: id_employee ? id_employee : null
		},{
			where: {m_mid: Message.id}
		}).then(sequelizeHandler)
		.then(function(FBMessage){
			//IMAGES, VIDEO, AUDIO FROM PAGE & USER			
			if(FBMessage && Message.attachments && Message.attachments.data.length >= 1){
				var Attachments = Message.attachments.data;
				return Sequelize.Promise.mapSeries(Attachments,function(Attachment){
					return FBAttachment.upsert({
						attachment_id:Attachment.id,
						m_mid:Message.id,
						mime_type:Attachment.mime_type,
						name:Attachment.name,
						image_data:JSON.stringify(Attachment.image_data),
						file_url:Attachment.file_url,
						size:Attachment.size,
						video_data:JSON.stringify(Attachment.video_data)
					}).then(sequelizeHandler).catch(sequelizeErrorHandler);
				});
			//STICKERS FROM USERS ONLY
			}else if(!Message.attachments && event && event.message && event.message.attachments){
				return Sequelize.Promise.mapSeries(event.message.attachments,function(attachment,i,N){
					return FBAttachment.upsert({
						attachment_id: 'sid_'+randomString('16','#Aa'),
						m_mid: Message.id,
						type: attachment.type,
						payload: JSON.stringify(attachment.payload),
						sticker_id: event.message.sticker_id ? event.message.sticker_id : null,
					},{
						where:{sticker_id:event.message.sticker_id,m_mid:Message.id}
					}).then(sequelizeHandler)
					.catch(sequelizeErrorHandler);
				});
			}else{
				//skip to next then
			}
		}).catch(sequelizeErrorHandler);
	});
}

function findOneConversation(t_mid){
	return FBConversation.findOne({
		where:{
			t_mid:t_mid,
		},
		include:[{model:FBLabel}]
	}).then(sequelizeHandler)
	.catch(sequelizeErrorHandler);
}

function upsertConversation(Conversation,psid,replied_last_by=null){
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
		replied_last_time:replied_last_by ? moment().utcOffset(0).format('YYYY-MM-DD HH:mm:ss') : undefined
	},{
		where: {
			t_mid: Conversation.id,
		},
	}).then(sequelizeHandler);
}

function upsertConversations(Conversations){
	return Sequelize.Promise.mapSeries(Conversations,function(Conversation,i){
		return upsertConversation(Conversation,null);
	}).then(sequelizeHandler);
}

function destroyConversationLabel(t_mid,label_id){
	return FBConversationLabel.destroy({
		where:{
			t_mid:t_mid,
			label_id:label_id
		},
		force:true
	}).then(sequelizeHandler)
	.catch(sequelizeErrorHandler);
}

function getTMID(PAGE_ACCESS_TOKEN,m_mid,psid,pid,upsert_missing=true){
	var r = {};

	console.log('2 ======================== 1 FBConversation.findOne(psid) =========================');
	return FBConversation.findOne({
		where : {psid:psid}
	}).then(sequelizeHandler)
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
					}).then(sequelizeHandler)
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
										winston.error('Conversation not found in top 25',{m_mid:m_mid,psid:psid,uid:r.uid});
										throw new Error('The Conversation is not found in the top 25 on the list');
									}
								}else{
									winston.error('FBGraphAPINoResultError',{f:'getConversations',pid:r.pid});
									throw new FBGraphAPINoResultError('getConversations');
								}
							}).then(function(t_mid){
								if(upsert_missing === true){
									return upsertConversations(r.Conversations);
								}
							}).then(function(success){
								return r.t_mid; //3RD RETURN CONDITION
							});
						}
					});
				}else{
					winston.error('FBGraphAPINoResultError',{m_mid:m_mid});
					throw new FBGraphAPINoResultError('getMessage');
				}
			})
		}
	})

}

function getAndUpsertMessageConversation(PAGE_ACCESS_TOKEN,t_mid,m_mid,event=null,psid=null,id_employee=null){
	var r = {};

	return getMessage(PAGE_ACCESS_TOKEN, m_mid)
	.then(function(response){
		if(response){
			r.Message = response;
			return getConversation(PAGE_ACCESS_TOKEN, t_mid);
		}else{
			winston.error('FBGraphAPINoResultError',{f:'getMessage',m_mid:m_mid});
			throw new FBGraphAPINoResultError('getMessage');
		}
	}).then(function(response){
		if(response){
			r.Conversation = response;
			if(r.Message && (event && event.message || event && event.delivery || !event) ){
				return upsertMessage(t_mid,[r.Message],event,id_employee);
			}else{
				winston.error('Error unknown messaging event');
				throw new Error('unknown messaging event');
			}
		}else{
			winston.error('FBGraphAPINoResultError',{f:'getConversation',t_mid:t_mid});
			throw new FBGraphAPINoResultError('getConversation');
		}
	}).then(function(InstanceOrSuccess){
		return upsertConversation(r.Conversation, (psid ? psid : null),(id_employee ? id_employee : null));
	}).then(function(success){
		return findOneMessage(m_mid);
	}).then(function(Instance){
		if(Instance){
			r.FBMessage = Instance;
			return findOneConversation(t_mid);
		}else{
			winston.error('SequelizeNoResultError',{f:'findOneMessage',m_mid:m_mid});
			throw new SequelizeNoResultError('findOneMessage');
		}
	}).then(function(Instance){
		if(Instance){
			r.FBConversation = Instance;
			return r;
		}else{
			winston.error('SequelizeNoResultError',{f:'findOneConversation',t_mid:t_mid});
			throw new SequelizeNoResultError('findOneConversation');
		}
	}).catch(function(err){
		throw err;
	});

}

function getAndUpsertConversation(PAGE_ACCESS_TOKEN,t_mid,psid,Conversation=null){
	var r = {};

	return getConversation(PAGE_ACCESS_TOKEN, t_mid)
	.then(function(response){
		if(response){
			Conversation = response;
			return upsertConversation(Conversation,psid);
		}else{
			winston.error('FBGraphAPINoResultError',{f:'getConversation',t_mid:t_mid});
			throw new FBGraphAPINoResultError('getConversation');
		}
	}).then(function(success){
		return findOneConversation(t_mid);
	}).then(function(Instance){
		if(Instance){
			r.FBConversation = Instance;
			return r;
		}else{
			winston.error('SequelizeNoResultError',{f:'findOneConversation',t_mid:t_mid});
			throw new SequelizeNoResultError('findOneConversation');
		}
	}).catch(function(err){
		throw err;
	});

}

function getAndUpsertMessages(PAGE_ACCESS_TOKEN,pid,t_mid,options={}){
	var total_count = typeof options.total_count !== undefined  ? options.total_count : null;
	var limit = typeof options.limit !== undefined ? options.limit : 100;

	var r = {};
	return Sequelize.Promise.all([
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
			//var MessagesNew = r.FBMessages;
			
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
			winston.error('FBGraphAPINoResultError',{f:'getMessages',t_mid:t_mid});
			throw new FBGraphAPINoResultError('getMessages');
		}
	}).then(function(success){
		return findAllMessages(t_mid,{limit:total_count});
	}).then(function(Instances){
		if(Instances && Instances.length>=1){
			r.FBMessages = Instances;
			return r;
		}else{
			winston.error('SequelizeNoResultError',{f:'findAllMessages',t_mid:t_mid});
			throw new SequelizeNoResultError('findAllMessages');
		}
	});
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

function sequelizeHandler(Instance){
	if(Instance instanceof Array){
		if(Instance.length >= 1 && Instance[0] instanceof Sequelize.Instance){
			return Instance;
		}else{
			return null;
		}
	}else if(Instance instanceof Sequelize.Instance){
		return Instance;
	}else if(Instance >= 1 || Instance === true){ //for destroy and upsert
		return Instance;
	}else if(!Instance){
		return Instance;
	}else{
		winston.error('SequelizeError',Instance);
		throw new SequelizeError('Instance: '+JSON.stringify(Instance));
	}
}

function sequelizeErrorHandler(err){
	if(err instanceof Error){
			winston.error('SequelizeError',err);
			throw new SequelizeError('Instance: '+JSON.stringify(err.message));
	}
}

function facebookGraphAPIHandler(response){
	if(response.success || (response.data && response.data.length >= 1)  || response.id){
		return response;
	}else if(response.message_id || response.recipient_id){
		return response;
	}else if(response.data && response.data.length === 0){
		return response;
	}else if(response.error){
		winston.error('FBGraphAPIStandardError',response);
		throw new FBGraphAPIStandardError(response.error.message);
	}else{
		winston.error('FBGraphAPIError',response);
		throw new FBGraphAPIError(JSON.stringify(response));
	}
}

function facebookGraphAPIErrorHandler(err){
	if(err instanceof Error){
		winston.error('FBGraphAPIError',err);
		throw new FBGraphAPIError(err.message);
	}
}

//NO USE FUNCTION

function createMessageSent(t_mid,Message,psid){
	return FBMessage.create({
		m_mid: Message.id,
		t_mid: t_mid,
		created_time:Message.created_time,
		uid_from:Message.from.id,
		uid_to:Message.to.data[0].id,
		message: Message.message,
		seq: null,
		psid_sender: Message.from.id,
		psid_recipient: psid ? psid : undefined,
		timestamp: Math.round(+new Date()),
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);
}

function createMessage(t_mid,Message,event){
	var result = {};
	//console.log('======================== FBMessage.create START =========================');
	return (()=>(
	FBMessage.create({
		m_mid: Message.id,
		t_mid: t_mid,
		created_time:Message.created_time,
		uid_from:Message.from.id,
		uid_to:Message.to.data[0].id,
		message: Message.message
		//seq: event.message.seq,
		//psid_sender: event.sender.id,
		//psid_recipient: event.recipient.id,
		//timestamp: event.timestamp
	}).then(sequelizeHandler).catch(sequelizeErrorHandler)))()
	.then(function(Instance){
		//console.log('======================== FBMessage.create END =========================');
		if(Instance){
			result.FBMessage = Instance;
			//console.log('========================INSERT RECEIVED MSG-ATTACH (START)=========================');
			//NON-STICKERS
			if(Message.attachments && Message.attachments.data.length >=1){
				//let attachments = Message.attachments;
				return Sequelize.Promise.mapSeries(Message.attachments.data,function(Attachment,i,N){
					//let Attachment = attachments.data[i];
					return (()=>(
					FBAttachment.create({
						attachment_id: Attachment.id,
						m_mid: Message.id,
						mime_type:Attachment.mime_type,
						name:Attachment.name,
						image_data:JSON.stringify(Attachment.image_data),
						file_url:Attachment.file_url,
						size:Attachment.size,
						video_data:JSON.stringify(Attachment.video_data)
						//type: attachment.type,
						//payload: JSON.stringify(attachment.payload),
						//sticker_id: null,
					}).then(sequelizeHandler).catch(sequelizeErrorHandler)))();
				});
			//STICKERS
			}else if(!Message.attachments && event && event.message && event.message.attachments){
				return Sequelize.Promise.mapSeries(event.message.attachments,function(attachment,i,N){
					return (()=>( 
					FBAttachment.create({
						attachment_id: 'sid_'+randomString('16','#Aa'),
						m_mid: Message.id,
						type: attachment.type,
						payload: JSON.stringify(attachment.payload),
						sticker_id: event.message.sticker_id ? event.message.sticker_id : null,
					}).then(sequelizeHandler).catch(sequelizeErrorHandler)))();
				});
			}else{
				//skip to next then
			}
		}else{
			var err = new SequelizeNoResultError('FBMessage.create');
			winston.error('SequelizeNoResultError',{f:'FBMessage.create'});
			throw err;
		}
	}).then(function(Instances){
		if(Instances){
			result.FBAttachments = Instances;
			result.FBMessage.setDataValue('FBAttachments',{data:result.FBAttachments});
			//result.FBMessage.FBAttachments = {data:result.FBAttachments};
		}
		return result.FBMessage;
	}).catch(function(err){
		throw err;
	})

}

function createConversation(Conversation,psid){
	return FBConversation.create({
		pid: Conversation.participants.data[1].id,
		uid: Conversation.participants.data[0].id,
		pid_uid: Conversation.participants.data[1].id+'_'+Conversation.participants.data[0].id,
		t_mid: Conversation.id,
		psid: psid,
		updated_time: Conversation.updated_time,
		link: Conversation.link,
		name: Conversation.participants.data[0].name,
		snippet:	Conversation.snippet,
		message_count: Conversation.message_count,
		unread_count: Conversation.unread_count,
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);
}

function syncLabels(PAGE_ACCESS_TOKEN, pid){
	var r = {};
	return FBLabel.findAll({where:{pid:pid}})
	.then(function(Instances){
		var label_ids = Instances.map((x,i)=>(x.label_id));
		console.log('FBLabel.findAll({where:{pid:pid}}).length'+Instances.length);
		return Sequelize.Promise.all([
			FBLabel.destroy({
				where: {pid: pid}
			}),
			FBConversationLabel.destroy({
				where: {label_id: {$in:label_ids}}
			})
		]);
	}).spread(function(rows_deleted,rows_deleted2){
		console.log('finish destroying');
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

			return Sequelize.Promise.mapSeries(r.Labels,(Label,i)=>{
				FBLabel.upsert({
					label_id:Label.id,
					name:Label.name,
					pid:pid
				},{where:{label_id:Label.id}})
			});
		}else{
			throw new Error('fbAPIRequestBatcher returns empty result');
		}
	}).then(function(Labels){
		console.log('Labels.length='+Labels.length)
		return Sequelize.Promise.mapSeries(r.unique_users,(User,i)=>{
			//console.log('User.i='+i+' User.id='+User.id);
			return FBConversation.findOne({
				where:{uid:User.id}
			}).then(function(fbconversation){
				if(fbconversation && fbconversation.t_mid){
					console.log('t_mid='+fbconversation.t_mid);
					var FBConversationLabels = Sequelize.Promise.mapSeries(User.labels,(Label,i)=>{
						console.log('UserLabels.i='+i+' Labels.id='+Label.id);
						return FBConversationLabel.create({
							t_mid_label_id:fbconversation.t_mid+'_'+Label.id,
							label_id:Label.id,
							t_mid:fbconversation.t_mid
						});
					});
					return FBConversationLabels;
				}else{
					// JUST SKIP IF CANNOT FIND
				}
			});
		});
	});

}

};
