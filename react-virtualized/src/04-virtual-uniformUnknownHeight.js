// react-virtualized, same height for all rows (but UNKNOWN A PRIORI)
// I implement a custom cache, so that row height estimation is only done once. See example4
// for a justification why this may be necessary

import React, { Component } from 'react';
import { VirtualScroll, CellMeasurer, defaultCellMeasurerCellSizeCache } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

const list = [];
for (let i = 0; i < 100000; i++) {
  list.push({
    label: `item ${i}`,
  });
}

const cellRenderer = ({ rowIndex }) => {
  const item = list[rowIndex];
  console.log(rowIndex);
  return (
    <div style={style.item}>
      {item.label}
    </div>
  );
};

const rowRenderer = ({ index }) => cellRenderer({ columnIndex: 1, rowIndex: index });

class Example extends Component {
  render() {
    const cellSizeCache = new defaultCellMeasurerCellSizeCache({
      uniformRowHeight: true,
      uniformColumnWidth: false,
    });
    return (
      <CellMeasurer
        cellRenderer={cellRenderer}
        cellSizeCache={cellSizeCache}
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
