// react-virtualized, dynamic heights (UNKNOWN A PRIORI, measured!)
// KNOWN LIMITATION:
// while this works well when the user mousewheels to the next/previous X records,
// it is slow if the user jumps to a record, say, 1000 rows down. The height estimation
// function must be called for all records in between

import React, { Component } from 'react';
import { VirtualScroll, CellMeasurer } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

const list = [];
for (let i = 0; i < 1000; i++) {
  list.push({
    label: `item ${i}`,
    subtitle: Math.random() > 0.5 ? 'x' : null,
  });
}

const cellRenderer = ({ rowIndex }) => {
  const item = list[rowIndex];
  console.log(rowIndex);
  return (
    <div style={style.item}>
      {item.label}
      {item.subtitle ? <span><br />{item.subtitle}</span> : null}
    </div>
  );
};

const rowRenderer = ({ index }) => cellRenderer({ columnIndex: 0, rowIndex: index });

class Example extends Component {
  render() {
    return (
      <CellMeasurer
        cellRenderer={cellRenderer}
        columnCount={1}
        rowCount={list.length}
        width={300}
      >
        {({ getRowHeight }) => (
          <VirtualScroll
            width={300}
            height={300}
            rowCount={list.length}
            rowHeight={getRowHeight}
            rowRenderer={rowRenderer}
            style={style.outer}
            overscanRowCount={1}
          />
        )}
      </CellMeasurer>
    );
  }
}

const style = {
  outer: {
    margin: 10,
    border: '1px solid black',
    // transform: 'translateZ(0)',
  },
  item: {
    borderBottom: '1px solid lightgray',
    padding: '4px 8px',
  },
};

export default Example;
