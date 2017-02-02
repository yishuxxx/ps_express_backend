module.exports = {
    entry: {
        inputpage:'./src/inputpage.js',
        orders:'./src/orders.js',
        onsen:'./src/onsen.js'
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
            },{
                test: /\.css$/,
                exclude: /node_modules/,
                loader: 'style-loader!css-loader'
            }
        ],
    }

};