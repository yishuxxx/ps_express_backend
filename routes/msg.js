module.exports = function Msg(express, request, rq, crypto, settings, Sequelize, sequelize, io, winston) {
let router = express.Router();
let moment = require('moment');
let {randomString,unique2DArray} = require('../src/Utils/Helper');
let {FBGraphAPIStandardError, FBGraphAPIError, SequelizeError} = require('../src/Utils/Error');

this.router = router;

// middleware that is specific to this router
/*
router.use('/',function (req, res, next) {
	console.log('Time: ', Date.now())
	next()
});
*/

const APP_SECRET = 'cf682be6c2942e8af05c7a5ea13ce065';
// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = 'TheOneAndOnlyToken';
// Generate a page access token for your page from the App Dashboard
//const PAGE_ACCESS_TOKEN = 'EAAIrWVlswogBADzmkKyItbSX4WsQQZBhVcHXcocwCapgLZAZCIAm6jlTcJE3Ay0cVBxpjZAs2CMfWf1mMcgXRfxrUaN8ai5JYz6VKU769qZBnS5SLZBNUki31bm2rxWZBOfZCGUT6UPXZBZAEULve2U67n4vbbt5E4kEw3P6kT0mx27gZDZD';

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = 'https://www.sy.com.my/api/msg/';
/*
if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
	console.error('Missing config values');
	process.exit(1);
}
*/
// var {FBUserFunc} = require('.src/models/FBUser');
// var FBUser = FBUserFunc(Sequelize,sequelize);
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

FBConversation.hasMany(FBMessage, {foreignKey:'t_mid'});
FBMessage.belongsTo(FBConversation, {foreignKey:'t_mid'});
FBMessage.hasMany(FBAttachment, {foreignKey:'m_mid'});
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

	socket.on('GET_LABELS', function(data) {
		console.log('======================== socket.on(GET_LABELS) =========================');
		var r = {pid:data.pid,list_i:data.list_i};

		console.log('======================== FBLabels.findAll START =========================');

		(()=>{
			return FBLabel.findAll({
				where:{pid:r.pid}
			}).then(sequelizeHandler)
			.catch(sequelizeErrorHandler);
		})()
		.then(function(Instances){
			if(Instances){
				console.log('======================== socket.emit(GET_LABELS) =========================');
				socket.emit('GET_LABELS', {
					data:Instances,
					list_i:r.list_i
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
		console.log('======================== socket.on(UPDATE_CONVERSATION_LABELS) =========================');

		var pid = data.pid;
		var t_mid = data.t_mid;
		var labels = data.labels;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
		var r = {};

		console.log('======================== FBConversationLabel.findAll START =========================');
		findOneConversation(t_mid)
		.then(function(Instance){
			console.log('======================== FBConversationLabel.findAll END =========================');
			r.FBConversation = Instance;
			console.log('r.FBConversation.uid='+r.FBConversation.uid);
			if(r.FBConversation && r.FBConversation.FBLabels && r.FBConversation.FBLabels.length >= 1){
				r.FBConversationLabels = r.FBConversation.FBLabels;
				var promises = [];
				r.FBConversationLabels.map((ConversationLabel,i)=>{
					var index = labels.findIndex((x,i)=>(parseInt(x.value,10) === parseInt(ConversationLabel.label_id,10)));
					if(index === -1){
						promises.push(
							destroyConversationLabel(t_mid,ConversationLabel.label_id)
						);
						promises.push(
							deletePageLabel(PAGE_ACCESS_TOKEN,r.FBConversation.uid,ConversationLabel.label_id)
						);
					}
				});
				return Sequelize.Promise.all(promises);
			}
		}).then(function(promise_all_result){
			console.log('r.FBConversation.uid='+r.FBConversation.uid);
			var promises = [];
			labels.map((label,i)=>{
				if(r.FBConversationLabels && r.FBConversationLabels.length >=1){
					var index = r.FBConversationLabels.findIndex((x,i)=>(parseInt(x.label_id,10) === parseInt(label.value,10)));
				}else{
					var index = -1;
				}
				if(index === -1){
					promises.push(
						FBConversationLabel.create({
							t_mid_label_id:t_mid+'_'+label.value,
							t_mid:t_mid,
							label_id:label.value
						}).then(sequelizeHandler)
						.catch(sequelizeErrorHandler)
					);
					console.log('r.FBConversation.uid='+r.FBConversation.uid);
					console.log('label.value='+label.value);
					promises.push(postPageLabel(PAGE_ACCESS_TOKEN,r.FBConversation.uid,label.value));
				}
			});
			return Sequelize.Promise.all(promises);

		}).then(function(promise_all_result){
			return findOneConversation(t_mid)
		}).then(function(FBConversation){
			io.local.emit('new message', {
				Conversation:FBConversation
			});
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		})
		
	});


	socket.on('GET_CONVERSATIONS', function(data) {
		console.log('======================== socket.on(GET_CONVERSATIONS) =========================');

		var pid = data.filter.pid;
		var before = moment.utc(data.filter.before).format("YYYY-MM-DD HH:mm:ss");
		var limit = data.filter.limit;
		var list_i = data.list_i;
		var r = {};

		console.log('======================== FBConversation.findAll START =========================');
		
		(()=>{
			return FBConversation.findAll({
				where:{
					pid:pid,
					updated_time:{$lt:before}
				},
				include:[{
					model:FBLabel
				},{
					model:FBMessage,
					include:[{
						model:FBAttachment
					}]
				}],
				order:[['updated_time','DESC']],
				limit:limit
			}).then(sequelizeHandler)
			.catch(sequelizeErrorHandler);		  
		})()
		.then(function(FBConversations){
			console.log('======================== FBConversation.findAll END =========================');
			r.FBConversations = FBConversations;

			if(r.FBConversations && r.FBConversations.length>=1){
				r.FBConversations.map((FBConversation,i)=>{
					r.FBConversations[i] = r.FBConversations[i].get({plain:true});
					r.FBConversations[i].FBMessages = null;
					//r.FBConversations[i].setDataValue('FBMessages',FBConversation.FBMessages.slice(0,25));					
					r.FBConversations[i].messages = {data:r.FBConversations[i].messages.data.slice(0,25)};
				});
				console.log('======================== socket.emit(GET_CONVERSATIONS) =========================');
				socket.emit('GET_CONVERSATIONS', {
					data:r.FBConversations,
					paging:{next:{
						pid:pid,
						before:r.FBConversations[r.FBConversations.length-1].updated_time,
						limit:limit
					}},
					list_i:list_i
				});
			}
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message,
			});
		});
		
	});

	socket.on('GET_MESSAGES',function(data){
		console.log('======================== socket.on(GET_MESSAGES) START =========================');
		//console.log(data);
		var r = data

		//console.log('======================== FBMessage.findAll START =========================');
		
		findAllMessages(r.t_mid,{limit:r.limit,before:r.before})
		.then(function(FBMessages){
			//console.log('======================== FBMessage.findAll END =========================');
			//console.log('type='+typeof FBMessages);

			if(FBMessages && FBMessages.length>= 1){
				console.log('length='+FBMessages.length);

				r.FBMessages = FBMessages;
				return FBMessages;

			}else{
				//console.log('======================== FBConversation.findOne+FBMessage.count START =========================');
				return Sequelize.Promise.all([
					FBConversation.findOne({
						where:{t_mid:r.t_mid}
					}),
					FBMessage.count({
						where:{t_mid:r.t_mid}
					})
				]).spread(function(Instance,message_count){
					//console.log('======================== FBConversation.findOne+FBMessage.count END =========================');
					if(Instance && message_count && Instance.message_count > message_count){
						return getMessages(Instance.pid,PAGE_ACCESS_TOKEN_LONG[Instance.pid],r.t_mid,100,null,(x,i)=>(false));
					}
				}).then(function(Messages){
					//console.log(Messages);
					if(Messages && Messages.length>=1){
						return upsertMessages(r.t_mid,Messages);
					}
				}).then(function(Messages){
					//console.log('======================== findAllMessages START =========================');
					if(Messages){
						//console.log(Messages.length);
						return findAllMessages(r.t_mid,{limit:null});
					}
				});
			}
		}).then(function(FBMessages){
			//console.log('======================== findAllMessages END =========================');

			if(FBMessages){
				console.log(FBMessages.length);
				socket.emit('GET_MESSAGES', {
					Messages:FBMessages,
					paging:{next:{}}
				});
			}else{
				socket.emit('ERROR', {
					error:'No More Messages',
					message:'No more messages to retreieve'
				});
			}
			console.log('======================== socket.on(GET_MESSAGES) END =========================');
		}).catch(function(err){
			socket.emit('ERROR', {
				error:err.name,
				message:err.message
			});
		})

	});

	let addedUser = false;
	// when the client emits 'new message', this listens and executes
	socket.on('new message', function(data) {
		// we tell the client to execute 'new message'
		console.log('new message');
		console.log(data);

		console.log('======================== FIND FB_CONVERSATION START =========================');
		FBConversation.findOne({
			where: {t_mid: data.t_mid},
		}).then(function(Instance) {
			let FBConversation = Instance;
			if(FBConversation) {
				psid = FBConversation.psid ? FBConversation.psid : null;
				if(psid) {
					return psid;
				}
			}
		}).then(function(psid) {
			console.log('======================== FIND FB_CONVERSATION END =========================');
			console.log(psid);

			let messageData = {
				recipient: {
					id: psid,
				},
				message: {
					text: data.message,
					metadata: 'DEVELOPER_DEFINED_METADATA',
				},
			};

			callSendAPI(messageData,{
				pid:data.pid,
				t_mid:data.t_mid,
				psid:(psid ? psid : null)
			}).then(function(r){
				console.log('======================== BROADCAST START =========================');
				io.local.emit('new message', {
					username: socket.username,
					Message:r.FBMessage,
					Conversation:r.FBConversation
				});
				console.log('======================== BROADCAST END =========================');
			});
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

		return rq({
			uri: uri,
			qs: qs,
			method: 'GET',
		}).then(function(res) {
			response = JSON.parse(res);

			if(response.data && response.data.length>=1) {
				r.data = r.data.concat(response.data);
				r.paging = response.paging;
				r.continue = true;
				r = breakCondition(r, response);
			}else if(response.data && response.data.length === 0) {
				r.data = r.data;
				r.paging = response.paging;
				r.continue = false;
			}else if(response.error) {
				throw new Error(response.error.message);
			}else{
				console.log(response);
				throw new Error('Unexpected Facebook response');
			}
			return r;
		}).catch(function(err) {
			throw err;
		});
	}

	getNextFBRequest(queryParams, r, breakCondition)
	.then(function(r) {
			if (!r.continue) {
					resolve(r);
			} else {
					console.log('r.data.length ============ '+r.data.length);
					console.log(r.paging);
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


function getConversations(pid,last_message_date_input,limit){
	let PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
	let last_message_date = last_message_date_input ? moment(last_message_date_input) : moment();
	let result = {};

	return new Sequelize.Promise(function(resolve, reject) {
		let uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
		let qs = {
			access_token: PAGE_ACCESS_TOKEN,
			fields: 'link,id,message_count,snippet,updated_time,unread_count,senders,messages{message,id,created_time,from,to,attachments}',
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
				fields: 'link,id,message_count,snippet,updated_time,unread_count,senders,messages{message,id,created_time,from,to,attachments}',
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
						pid: Conversation.senders.data[1].id,
						uid: Conversation.senders.data[0].id,
						pid_uid: Conversation.senders.data[1].id+'_'+Conversation.senders.data[0].id,
						t_mid: Conversation.id,
						psid: null,
						updated_time: Conversation.updated_time,
						link: Conversation.link,
						name: Conversation.senders.data[0].name,
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
					attachment_id: Message.attachments ? Message.attachments.data[0].id : null 
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

router.get('/messages',function(req,res){

	FBMessage.findAll({
		where:{t_mid:'t_mid.1442286828612:0a18275c12a2dfe520'},
	include:[{
		model:FBAttachment,
	}],
		order:[['created_time','DESC']]
	}).then(function(FBMessages){
		FBMessages.map((FBMessage,i)=>{
			if(FBMessage.FBAttachments && FBMessage.FBAttachments.length >=1){
				FBMessage.setDataValue('attachments',{data:FBMessage.FBAttachments});
			}
		});
		res.send(FBMessages);
	});

});

router.get('/labels',function(req,res){
	var pid = req.query.pid;
	var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
	var r = {};

	FBLabel.destroy({
    where: {
      pid: pid
    }
  }).then(function(rows_deleted){

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
				}
			});
		});

	}).then(function(nested){
		res.send({length:nested.length});
	});
});

router.get('/postlabel',function(req,res){
	var pid = req.query.pid;
	var uid = req.query.uid;
	var label_id = req.query.label_id;
	var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_LONG[pid];
	var r = {};

	postPageLabel(PAGE_ACCESS_TOKEN,uid,label_id)
	.then(function(response){
		res.send({response:response});
	}).catch(function(err){
		if(err instanceof Error){
			res.send({success:false,error:err.name,message:err.message});
		}
	});

});

router.get('/seqerror',function(req,res){
	findAllMessages(req.query.t_mid)
	.then(function(Instances){
		res.send({data:Instances});
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
	console.log(data);

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

// INSERT into fb_message and then do the default messenger sample action - echo
function receivedMessage(event) {
	let senderID = event.sender.id;
	let recipientID = event.recipient.id;
	let timeOfMessage = event.timestamp;
	let message = event.message;

	console.log('========================RECEIVE MSG=========================');
	console.log('Received message for user %s and page %s at %s with message:',
		senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(event));

	let isEcho = message.is_echo;
	let messageId = message.mid;
	let appId = message.app_id;
	let metadata = message.metadata;

	// You may get a text or attachment but not both
	let messageText = message.text;
	let messageAttachments = message.attachments;
	let quickReply = message.quick_reply;
	
	var r = {pid:event.recipient.id,psid:event.sender.id,m_mid:'m_'+messageId};
	rq({
		uri: 'https://graph.facebook.com/v2.8/'+r.m_mid,
		qs: {
			access_token: PAGE_ACCESS_TOKEN_LONG[r.pid],
			fields: 'attachments{mime_type,name,size,file_url,image_data,video_data,id},created_time,from,id,message,to'
		},
		method: 'GET',
		json:true
	}).then(function(response){
		if(response.id && !response.error){
			r.Message = response;
			r.pid_uid = r.pid+'_'+r.Message.from.id;
			console.log('======================== FBConversation.findOne START =========================');
			return FBConversation.findOne({
				where : {pid_uid:r.pid_uid}
			});
		}
	}).then(function(Instance){
		console.log('======================== FBConversation.findOne END =========================');				
		if(Instance && Instance.t_mid){
			r.FBConversation = Instance;
			r.t_mid = r.FBConversation.t_mid;

			console.log('======================== GET Conversation START =========================');	
			return rq('https://graph.facebook.com/v2.8/'+r.t_mid,{
				qs:{
					access_token: PAGE_ACCESS_TOKEN_LONG[r.pid],
					fields: 'id,snippet,updated_time,message_count,unread_count'
				},
				method:'GET',
				json:true
			}).then(function(response){
				console.log('======================== GET Conversation END =========================');	
				r.Conversation = response;

				r.FBConversation.snippet = r.Conversation.snippet;
				r.FBConversation.updated_time = r.Conversation.updated_time;
				r.FBConversation.message_count = r.Conversation.message_count;
				r.FBConversation.unread_count = r.Conversation.unread_count;

				if(!r.FBConversation.psid){
					console.log('======================== FBConversation.psid NULL =========================');		
					r.FBConversation.setDataValue('psid',r.psid);
					return r.FBConversation.save();
				}else{
					console.log('======================== FBConversation.psid OK =========================');	
					return r.FBConversation;
				}
				return r.FBConversation.save();

			});

		}else{
			console.log('======================== getconversations START =========================');
			return getConversations(r.pid,null,25)
			.then(function(response){
				console.log('======================== getconversations END =========================');
				if(response.data && response.data.length >=1){
					r.Conversations = response;
					let Conversations = response.data;
					let index = Conversations.findIndex((Conversation,i)=>(
						(Conversation.senders.data[1].id+'_'+Conversation.senders.data[0].id) === r.pid_uid
					));
					if(index !== -1){
						var Conversation = Conversations[index];
						console.log('======================== FBConversation.create (START)=========================');
						return createConversation(Conversation,senderID);
					}else{
						throw new Error('The Conversation is not found in the top 25 on the list');
					}
				}else if(response.error){
					throw new Error(response);
				}else{
					throw new Error(response);
				}
			})
		}
	}).then(function(FBConversation){
		console.log('======================== FBConversation.create END =========================');
		
		if(FBConversation){
			r.FBConversation = FBConversation;
			console.log('======================== FBMessage.create START =========================');
			return FBMessage.create({
				m_mid: 'm_'+message.mid,
				t_mid: FBConversation.t_mid,
				created_time:r.Message.created_time,
				uid_from:r.Message.from.id,
				uid_to:r.Message.to.data[0].id,
				message: message.text,
				seq: message.seq,
				psid_sender: event.sender.id,
				psid_recipient: event.recipient.id,
				timestamp: event.timestamp,
			});

		}

	}).then(function(FBMessage){
		console.log('======================== FBMessage.create END =========================');
		if(FBMessage){
			r.FBMessage = FBMessage;
		}

		if(FBMessage && messageAttachments){
			console.log('========================INSERT RECEIVED MSG-ATTACH (START)=========================');
			console.log(messageAttachments);

			//NON-STICKERS
			if(r.Message.attachments){
				let attachments = r.Message.attachments;
				return Sequelize.Promise.mapSeries(messageAttachments,function(messageAttachment,i,N){
						let Attachment = attachments.data[i];
						return FBAttachment.create({
							attachment_id: attachments.data[i].id,
							m_mid: 'm_'+message.mid,
							mime_type:Attachment.mime_type,
							name:Attachment.name,
							image_data:JSON.stringify(Attachment.image_data),
							file_url:Attachment.file_url,
							size:Attachment.size,
							video_data:JSON.stringify(Attachment.video_data),
							type: messageAttachment.type,
							payload: JSON.stringify(messageAttachment.payload),
							sticker_id: null,
						});
				});
			//STICKERS
			}else if(r.Message && !r.Message.attachments){
				return Sequelize.Promise.mapSeries(messageAttachments,function(messageAttachment,i,N){
						return FBAttachment.create({
							attachment_id: 'sid_'+randomString('16','#Aa'),
							m_mid: 'm_'+message.mid,
							type: messageAttachment.type,
							payload: JSON.stringify(messageAttachment.payload),
							sticker_id: message.sticker_id ? message.sticker_id : null,
						});
				});
			}
		}
	}).then(function(FBAttachments){
		r.FBMessage.setDataValue('attachments',{data:FBAttachments});

		return findOneConversation(r.t_mid);

	}).then(function(Instance){
		if(Instance){
			r.FBConversation = Instance;
		}
		console.log('========================INSERT RECEIVED MSG-ATTACH (END)=========================');
		//r2 = {Conversation:r.FBConversation};
		io.local.emit('new message', {Conversation:r.FBConversation,Message:r.FBMessage});
		/*
		let conversation_info = {pid:r.FBConversation.pid,t_mid:r.FBConversation.t_mid,psid:senderID};

		if (isEcho) {
			// Just logging message echoes to console
			console.log('Received echo for message %s and app %d with metadata %s',
				messageId, appId, metadata);
			return;
		} else if (quickReply) {
			let quickReplyPayload = quickReply.payload;
			console.log('Quick reply for message %s with payload %s',
				messageId, quickReplyPayload);

			sendTextMessage(conversation_info, 'Quick reply tapped');
			return;
		}
		
		if (messageText) {

			// If we receive a text message, check to see if it matches any special
			// keywords and send back the corresponding example. Otherwise, just echo
			// the text we received.
			switch (messageText) {
				case 'image':
					sendImageMessage(senderID);
					break;

				case 'gif':
					sendGifMessage(senderID);
					break;

				case 'audio':
					sendAudioMessage(senderID);
					break;

				case 'video':
					sendVideoMessage(senderID);
					break;

				case 'file':
					sendFileMessage(senderID);
					break;

				case 'button':
					sendButtonMessage(senderID);
					break;

				case 'generic':
					sendGenericMessage(senderID);
					break;

				case 'receipt':
					sendReceiptMessage(senderID);
					break;

				case 'quick reply':
					sendQuickReply(senderID);
					break;

				case 'read receipt':
					sendReadReceipt(senderID);
					break;

				case 'typing on':
					sendTypingOn(senderID);
					break;

				case 'typing off':
					sendTypingOff(senderID);
					break;

				case 'account linking':
					sendAccountLinking(senderID);
					break;

				default:
					sendTextMessage(conversation_info, messageText);
			}
		} else if (messageAttachments) {
			sendTextMessage(conversation_info, 'Message with attachment received');
		}
		*/
	}).catch(function(err) {
		console.log(err);
	});

}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
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
			console.log('Received delivery confirmation for message ID: %s',
				messageID);
			console.log('recipient'+recipientID);
			console.log('sender'+senderID);
			console.log(event);
			console.log('======================== DELIVERY TIMESTAMP =========================');
			console.log(moment(event.timestamp).format('YYYY-MM-DD HH:mm:ss'));

			let r = {m_mid:'m_'+messageID,pid:recipientID,psid:senderID};
			FBMessage.findOne({
				where: {m_mid: r.m_mid},
			}).then(function(Instance) {
				
				if(Instance) {
					r.FBMessage = Instance;
					r.FBMessage.delivered_timestamp = event.timestamp;
					console.log('======================== FBMessage.save START =========================');
					return r.FBMessage.save();
				}else{
					console.log('======================== getMessage START =========================');
					return getMessage(PAGE_ACCESS_TOKEN_LONG[r.pid],r.m_mid)
					.then(function(Message){
						console.log('======================== getMessage END =========================');
						if(Message){
							r.Message = Message;
							console.log('======================== FBConversation.findOne START =========================');
							return FBConversation.findOne({where:{pid:r.pid,uid:Message.to.data[0].id}});
						}
					}).then(function(Instance){
						console.log('======================== FBConversation.findOne END =========================');
						if(Instance){
							r.FBConversation = Instance;
							return r.FBConversation;
						}else{
							console.log('======================== getConversations START =========================');
							getConversations(r.pid,null,25)
							.then(function(Conversations){

								console.log('======================== getconversations END =========================');
								if(response.data && response.data.length >=1){
									r.Conversations = response;
									let Conversations = response.data;
									let index = Conversations.findIndex((Conversation,i)=>(
										(Conversation.senders.data[1].id+'_'+Conversation.senders.data[0].id) === r.pid_uid
									));
									if(index !== -1){
										var Conversation = Conversations[index];
										console.log('======================== FBConversation.create START =========================');
										return createConversation(Conversation,r.psid);
									}else{
										throw new Error('The Conversation is not found in the top 25 on the list');
									}
								}else if(response.error){
									throw new Error(response);
								}else{
									throw new Error(response);
								}

							});

						}
					}).then(function(Instance){
						console.log('======================== FBConversation.create/findOne END =========================');
						if(Instance){
							r.FBConversation = Instance;
							console.log('======================== upsertMessage START =========================');
							return upsertMessage(r.FBConversation.t_mid,[r.Message],event.timestamp);
						}
					});
				}
			}).then(function(Instance) {
				console.log('======================== FBMessage.findOne/upsert END =========================');
				if(Instance) {
					console.log('======================== FBMessage.findOne START =========================');

					return FBMessage.findOne({
						where:{m_mid:r.m_mid},
						include:[{
							model:FBAttachment
						}]
					}).then(sequelizeHandler)
					.catch(sequelizeErrorHandler);

				}
			}).then(function(Message){
				if(Message){
					r.FBMessage = Message;
					return findOneConversation(r.FBMessage.t_mid)
				}else{
					throw new Error('Result not found');
				}
			}).then(function(Conversation){
				if(Conversation){
					r.FBConversation = Conversation;
					console.log('t_mid='+Conversation.t_mid);
					io.local.emit('new message', {Conversation:r.FBConversation,Message:r.FBMessage});
				}else{
					throw new Error('Result not found');
				}
			}).catch(function(err){
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

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData,conversation_info=null) {

	var r = conversation_info ? conversation_info : {};
	return new Sequelize.Promise(function(resolve,reject){
		if(r.psid){
			//console.log('========================SEND MSG PSID (START)=========================');
			postMessageByPSID(PAGE_ACCESS_TOKEN_MESSENGER[r.pid],messageData)
			.then(function(response){
				//console.log('========================SEND MSG PSID (END)=========================');
				r.m_mid = 'm_'+response.message_id;
				resolve('m_'+response.message_id);
			});
			
		}else{
			//console.log('========================SEND MSG T_MID (START)=========================');
			postMessageByTMID(PAGE_ACCESS_TOKEN_LONG[r.pid],messageData.message.text)
			.then(function(response){
				//console.log('========================SEND MSG T_MID (END)=========================');
				r.m_mid = response.id;
				resolve(response.id);
			});

		}

	}).then(function(m_mid){
		//console.log('======================== Promise RESOLVED =========================');
		//console.log('========================GET MSG (START)=========================');

		return getMessage(PAGE_ACCESS_TOKEN_LONG[r.pid],r.m_mid)

	}).then(function(response){
		//console.log('========================GET MSG (END)=========================');
		
		r.Message = response;
		//console.log('type='+typeof r.Message);

		//console.log('========================INSERT SENT MSG (START)=========================');
		return createMessageSent(r.t_mid,r.Message,r.psid);

	}).then(function(Instance) {
		//console.log('========================INSERT SENT MSG (END)=========================');
		if(Instance){
			r.FBMessage = Instance;
			//console.log('======================== FBConversation.findOne (START)=========================');
			return findOneConversation(r.t_mid);
		}else{
			throw ('CANNOT CREATE FBMessage.m_mid = '+r.Message.id);
		}
	}).then(function(Instance) {
		//console.log('======================== FBConversation.findOne (END)=========================');
		if(Instance){
			r.FBConversation = Instance;
			//console.log('======================== FBConversation.save (START)=========================');
			r.FBConversation.message_count += 1;
			r.FBConversation.updated_time = r.FBMessage.created_time;
			return r.FBConversation.save();
		}else{
			throw ('CANNOT FIND FBConversation.t_mid = '+r.t_mid);
		}
	}).then(function(Instance) {
		//console.log('======================== FBConversation.save (END)=========================');
		if(Instance){
			return r;
		}else{
			throw ('CANNOT SAVE FBConversation.t_mid = '+r.t_mid);
		}
		
	});

}

function postMessageByPSID(PAGE_ACCESS_TOKEN_MESSENGER,message_data){
	return rq({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token: PAGE_ACCESS_TOKEN_MESSENGER},
		method: 'POST',
	json: message_data
	}).then(facebookGraphAPIHandler)
  	.catch(facebookGraphAPIErrorHandler);
}

function postMessageByTMID(PAGE_ACCESS_TOKEN,t_mid,message){
	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+t_mid+'/messages',
		qs: {access_token: PAGE_ACCESS_TOKEN,message:message},
		method: 'POST',
	json: true
	}).then(facebookGraphAPIHandler)
  	.catch(facebookGraphAPIErrorHandler);
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
		}).then(facebookGraphAPIHandler)
  	.catch(facebookGraphAPIErrorHandler);
}

function getMessages(pid,PAGE_ACCESS_TOKEN,t_mid,limit,total_count,matchFunc){
	let uri = 'https://graph.facebook.com/v2.8/'+t_mid+'/messages';
	let qs = {
		access_token: PAGE_ACCESS_TOKEN,
		fields: 'id,message,created_time,from,to,attachments',
		limit: limit
	};

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

function getPageLabels(PAGE_ACCESS_TOKEN,options={}){
	var limit = options.limit === undefined ? 100 : options.limit;
	console.log(options);
	console.log(limit);
	let uri = 'https://graph.facebook.com/v2.8/me/labels';
	let qs = {
		access_token: PAGE_ACCESS_TOKEN,
		limit: limit
	};
	return fbAPIRequestIterator(uri,qs,limit,options);
}

function postPageLabel(PAGE_ACCESS_TOKEN,uid,label_id,options={}){
	var is_delete = options.is_delete === undefined ? false : options.is_delete;

	console.log('======================== postPageLabel START =========================');
	return rq({
		uri: 'https://graph.facebook.com/v2.8/'+label_id+'/users',
		qs: {
			access_token: PAGE_ACCESS_TOKEN,
			user_ids: '['+uid+']'
		},
		method: is_delete ? 'DELETE' : 'POST',
			json: true
  	}).then(facebookGraphAPIHandler)
  	.catch(facebookGraphAPIErrorHandler);

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
		console.log(r);
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

function findAllMessages(t_mid,options={}){
	var limit = (options.limit !== undefined) ? options.limit : 25;
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
	}],
		order:[['created_time','DESC']],
		limit:limit
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);
}

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
		psid_recipient: psid ? psid : null,
		timestamp: Math.round(+new Date()),
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
			where: {
				m_mid: Message.id,
			},
		}).then(sequelizeHandler)
		.then(function(FBMessage){
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
			}
		}).catch(sequelizeErrorHandler);
	});
}

function upsertMessage(t_mid,Messages,delivery_timestamp,read_timestamp){
	return Sequelize.Promise.mapSeries(Messages,(Message,i)=>{
		return FBMessage.upsert({
			m_mid: Message.id,
			t_mid: t_mid,
			created_time: Message.created_time,
			uid_from: Message.from.id,
			uid_to: Message.to.data[0].id,
			message: Message.message,
			attachment_id: Message.attachments ? Message.attachments.data[0].id : null,
			delivery_timestamp:delivery_timestamp ? delivery_timestamp : null,
			read_timestamp:read_timestamp ? read_timestamp : null
		},{
			where: {
				m_mid: Message.id,
			},
		}).then(sequelizeHandler)
		.then(function(FBMessage){
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

function createConversation(Conversation,psid){

	return FBConversation.create({
		pid: Conversation.senders.data[1].id,
		uid: Conversation.senders.data[0].id,
		pid_uid: Conversation.senders.data[1].id+'_'+Conversation.senders.data[0].id,
		t_mid: Conversation.id,
		psid: psid,
		updated_time: Conversation.updated_time,
		link: Conversation.link,
		name: Conversation.senders.data[0].name,
		snippet:	Conversation.snippet,
		message_count: Conversation.message_count,
		unread_count: Conversation.unread_count,
	}).then(sequelizeHandler).catch(sequelizeErrorHandler);

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


};
