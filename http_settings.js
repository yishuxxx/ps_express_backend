var client_http_settings = {
	GET_JSON:{
      method:'GET',
      headers:{
        'Content-Type': 'application/json',
        'Accept':'application/json'
      },
      credentials: "same-origin"
	},
	POST_JSON:{
      method:'POST',
      headers:{
        'Content-Type': 'application/json',
        'Accept':'application/json'
      },
      credentials: "same-origin"
	}
}

module.exports.client_http_settings = client_http_settings;