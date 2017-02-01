import { orderBy } from 'lodash';
import React, { Component } from 'react';
import { FlexTable, FlexColumn } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

const list = [];
const LETTERS = ['A', 'B', 'C', 'D'];
for (let i = 0; i < 1000; i++) {
  list.push({
    label: `item ${i}`,
    desc: <span><b>{LETTERS[i % LETTERS.length]}</b> {i}</span>,
    height: 30 + Math.random() * 30,
  });
}

const descRenderer = ({ rowData }) => {
  return rowData.desc;
};

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: null,
      sortDirection: null,
    };
  }

  render() {
    const { sortBy, sortDirection } = this.state;
    const items = this.sort(list, sortBy, sortDirection);
    return (
      <FlexTable
        width={500}
        height={400}
        headerHeight={30}
        rowCount={items.length}
        rowHeight={({ index }) => items[index].height}
        rowGetter={({ index }) => items[index]}
        sort={options => this.onChangeSort(options)}
        sortBy={sortBy}
        sortDirection={sortDirection}
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
    );
  }

  onChangeSort({ sortBy, sortDirection }) {
    console.log(sortBy, sortDirection);
    this.setState({ sortBy, sortDirection });
  }

  sort(items, sortBy, sortDirection) {
    if (!sortBy) return items;
    const out = orderBy(items, [sortBy], [sortDirection.toLowerCase()]);
    return out;
  }
}

const style = {
  outer: {
    border: '1px solid black',
  },
};

export default Example;
