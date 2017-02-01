// react-virtualized, dynamic heights (known a priori)

import React, { Component } from 'react';
import { VirtualScroll } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

const list = [];
for (let i = 0; i < 1000; i++) {
  list.push({
    label: `item ${i}`,
    height: 20 + Math.random() * 30,
  });
}

const rowRenderer = ({ index }) => {
  const item = list[index];
  return (
    <div>
      {item.label}
    </div>
  );
}

class Example extends Component {
  render() {
    return (
      <VirtualScroll
        width={300}
        height={300}
        rowCount={list.length}
        rowHeight={({ index }) => list[index].height}
        rowRenderer={rowRenderer}
        overscanRowCount={0}
      />
    );
  }
}

export default Example;
