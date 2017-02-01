module.exports = 

  entry: './entry.cjsx'

  output:
    filename: 'entry.js'
    path: process.cwd()
    publicPath: '/'

  resolve:
    extensions: ['', '.coffee', '.cjsx', '.jsx', '.js']

  module:
    loaders: [
      test: /\.cjsx$/
      loader: 'coffee!cjsx'
    ,
      test: /\.coffee$/
      loader: 'coffee'
    ]
