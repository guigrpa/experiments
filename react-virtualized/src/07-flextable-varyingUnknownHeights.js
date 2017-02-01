import React, { Component } from 'react';
import { AutoSizer, CellMeasurer, FlexTable, FlexColumn } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

const list = [];
for (let i = 0; i < 1000; i++) {
  list.push({
    label: `item ${i}`,
    desc: `desc ${i}`,
    subtitle: Math.random() > 0.5 ? 'more content' : null,
  });
}

const descRenderer = ({ rowData }) => {
  if (rowData.subtitle) {
    return <span>{rowData.desc}<br />{rowData.subtitle}</span>;
  } else {
    return <span>rowData.desc</span>;
  }
};

const cellRenderer = ({ rowIndex, columnIndex }) => {
  const item = list[rowIndex];
  if (columnIndex === 0) {
    return <span>{item.label}</span>;
  } else {
    return descRenderer({ rowData: item });
  }
};

class Example extends Component {
  render() {
    return (
      <div style={{ width: 400, height: 500 }}>
        <AutoSizer>
          {({ height, width }) => (
            <CellMeasurer
              cellRenderer={cellRenderer}
              columnCount={2}
              rowCount={list.length}
              width={width}
            >
              {({ getRowHeight }) => (
                <FlexTable
                  width={width}
                  height={height}
                  headerHeight={30}
                  rowCount={list.length}
                  rowHeight={getRowHeight}
                  rowGetter={({ index }) => list[index]}
                  style={style.outer}
                >
                  <FlexColumn label='Label' dataKey='label' width={100} />
                  <FlexColumn
                    label='Desc'
                    dataKey='desc'
                    cellRenderer={descRenderer}
                    width={200} flexGrow={1}
                  />
                </FlexTable>
              )}
            </CellMeasurer>
          )}
        </AutoSizer>
      </div>
    );
  }
}

const style = {
  outer: {
    border: '1px solid black',
  },
};

export default Example;
