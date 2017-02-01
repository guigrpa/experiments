React = require 'react'
ReactDOM = require 'react-dom'
Hello = require './hello'

window.renderHello = (id, props) ->
  ReactDOM.render <Hello {...props}/>, document.getElementById(id)
