# React from scratch

**Goal**: use React as a tiny module inside a larger webapp, e.g. to implement one of its components.

## The original page

Your original page (`/index.html`) may be something like this... (OK, probably much more complex!):

```html
<!doctype html>
<html>
  <head>
    <title>Hello world</title>
  </head>
  <body>
    <p>This is the previous contents of the page...</p>
    <p>Interesting, huh?</p>
  </body>
</html>
```

You may be building your page in PHP... :sweat:... but no problem! We will see how we can incorporate React from scratch, without requiring lots of tools and adding too much complexity.


## Adding React

Pre-requisite: install Node. Note that this environment is only needed for development, not for production (in our particular case).

**1.** In the root directory of your repo, run `npm init`. Say OK to everything (press `ENTER` until you feel tired). This will create a nice little `package.json` file for you.

**2.** Install some dependencies: `npm install --save react react-dom webpack coffee-loader cjsx-loader coffee-script http-server`. Now you've already got a ton of files inside a new folder, `node_modules`, and your `package.json` also registers the dependencies you are collecting.

**3.** Create a simple React component. This is CJSX (I :heart: CoffeeScript!), but you can use JSX or vanilla JS if you wish (`hello.cjsx`):

```coffee
React = require 'react'

module.exports = React.createClass
  displayName: 'Hello'
  propTypes:
    name: React.PropTypes.string
  
  render: ->
    <div>Hello, {@props.name}!</div>
```

**4.** Create an entry point for your module (`entry.cjsx`):

```coffee
React = require 'react'
ReactDOM = require 'react-dom'
Hello = require './hello'

window.renderHello = (id, props) ->
  ReactDOM.render <Hello {...props}/>, document.getElementById(id)
```

This entry point will allow using our component from the outside, without requiring the rest of your application to know anything about `react`, `react-dom`, etc.

**5.** Build your application with Webpack. Add the following lines to your `package.json` file (inside the `scripts` attribute):

```json
"scripts": {
  "build": "webpack --config ./webpackConfig.coffee --colors --display-chunks",
  "start": "http-server",
  ...
}
```

Copy the following configuration to `webpackConfig.coffee`:

```coffee
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
```

Ready? Now run `npm run build`, which will spit out an `entry.js` file that you can use wherever you want. This file is fully stand-alone and contains your React component, your entry point and all dependencies that are needed.

**6.** Update your webapp to use your brand new component (`index.html`):

```html
    <div id="hello"></div>

    <script src="/entry.js"></script>
    <script>renderHello("hello", {name: "Guillermo"});</script>
```

The `<div>` is just an example of placeholder where we might want to mount our component. The first `<script>` tag loads the result of Webpack's build (all included, even dependencies). Finally, the second `<script>` shows how we can mount our component (passing in some `props`) wherever we want.

To see what you've done, just run `npm start`, open a browser and go to `http://localhost:8080`. Voilà!

Of course, this is just the start... Enjoy! :wave:
