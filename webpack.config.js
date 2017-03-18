module.exports = {
    entry: {
        inputpage:'./src/inputpage.js',
        orders:'./src/orders.js',
        onsen:'./src/onsen.js',
        fastpage:'./src/fastpage.js',
        privatereply:'./src/privatereply',
        login:'./src/login'
    },
    output: {
        filename: './public/javascripts/bundle_[name].js'
    },
    module: {
        loaders: [
              {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015','react','stage-2']
                }
              },
              {
                test: /\.css$/,
                exclude: /node_modules/,
                loader: 'style-loader!css-loader'
              },
              { 
                test: /\.png$/, 
                loader: "url-loader?limit=100000" 
              },
              { 
                test: /\.jpg$/, 
                loader: "file-loader" 
              },
              {
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url?limit=10000&mimetype=application/font-woff'
              },
              {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url?limit=10000&mimetype=application/octet-stream'
              },
              {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'file'
              },
              {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url?limit=10000&mimetype=image/svg+xml'
              }
        ],
    }

};