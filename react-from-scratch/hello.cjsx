React = require 'react'

module.exports = React.createClass
  displayName: 'Hello'
  propTypes:
    name: React.PropTypes.string
  
  render: ->
    <div>Hello, {@props.name}!</div>
