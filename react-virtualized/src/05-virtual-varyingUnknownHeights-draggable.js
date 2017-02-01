// react-virtualized, dynamic heights (UNKNOWN A PRIORI AND DIFFERENT, measured!)
// Add SORTABLE HOC (react-sortable-hoc), complete with drag handle

import React, { Component } from 'react';
import { VirtualScroll, CellMeasurer } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';

const list = [];
for (let i = 0; i < 1000; i++) {
  list.push({
    id: i,
    label: `item ${i}`,
    subtitle: Math.random() > 0.5 ? 'more content' : null,
  });
}

const DragHandle = SortableHandle(() => <span style={style.handle}>***</span>)

const Row = ({ item }) => {
  // console.log(`Rendering ${item.label}...`);
  return (
    <div style={style.item}>
      <DragHandle />
      {item.label}
      {item.subtitle ? <span><br />{item.subtitle}</span> : null}
    </div>
  );
};
const SortableRow = SortableElement(Row);

class List extends Component {
  constructor(props) {
    super(props);
    this.cachedHeights = {};
  }

  render() {
    console.log('Rendering list...')
    const { items } = this.props;
    return (
      <CellMeasurer
        cellRenderer={({ rowIndex }) => Row({ item: items[rowIndex] })}
        cellSizeCache={this}
        columnCount={1}
        rowCount={items.length}
        width={300}
      >
        {({ getRowHeight }) => (
          <VirtualScroll
            ref={c => { this.refVirtualScroll = c; }}
            width={300}
            height={300}
            rowCount={items.length}
            rowHeight={getRowHeight}
            rowRenderer={({ index }) => <SortableRow index={index} item={items[index]} />}
            style={style.outer}
            overscanRowCount={1}
          />
        )}
      </CellMeasurer>
    );
  }

  recomputeRowHeights() {
    if (!this.refVirtualScroll) return;
    this.refVirtualScroll.recomputeRowHeights();
  }

  // Height cache -- we implement it right in the component so that we can use
  // row ID as the key instead of the index. This way, re-sorting rows does not
  // require re-rendering to recalculate heights
  clearAllColumnWidths() {}
  clearAllRowHeights() {
    console.log('clearAllRowHeights()');
    this.cachedHeights = {};
  }
  clearColumnWidth(index) {}
  clearRowHeight(index) {
    console.log(`clearRowHeight(${index})`);
    const id = this.props.items[index].id;
    this.cachedHeights[id] = undefined;
  }
  getColumnWidth (index) { return undefined; }
  getRowHeight (index) {
    // console.log(`getRowHeight(${index})`);
    const id = this.props.items[index].id;
    return this.cachedHeights[id];
  }
  hasColumnWidth (index) { return false; }
  hasRowHeight (index) {
    // console.log(`hasRowHeight(${index})`);
    const id = this.props.items[index].id;
    return this.cachedHeights[id] >= 0;
  }
  setColumnWidth (index, width) {}
  setRowHeight (index, height) {
    // console.log(`setRowHeight(${index}, ${height})`);
    const id = this.props.items[index].id;
    this.cachedHeights[id] = height;
  }
}
const SortableList = SortableContainer(List, { withRef: true });

class Example extends Component {
  constructor() {
    super();
    this.state = { items: list };
    this.onSortEnd = this.onSortEnd.bind(this);
  }

  render() {
    return (
      <SortableList
        ref={c => { this.refSortableList = c; }}
        items={this.state.items}
        onSortEnd={this.onSortEnd}
        useDragHandle
      />
    );
  }

  onSortEnd({ oldIndex, newIndex }) {
    const { items } = this.state;
    arrayMove(items, oldIndex, newIndex);
    this.setState({ items });
    const instance = this.refSortableList.getWrappedInstance();
    instance.recomputeRowHeights();
    // instance.forceUpdate();
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
  handle: {
    marginRight: 10,
    cursor: 'pointer',
  },
};

export default Example;
