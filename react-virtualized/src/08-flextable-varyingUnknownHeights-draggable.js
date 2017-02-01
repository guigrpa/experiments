import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { AutoSizer, CellMeasurer, FlexTable, FlexColumn, defaultFlexTableRowRenderer } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';

const SIMPLIFIED_EXAMPLE = false;

// Example data
const list = [];
for (let i = 0; i < 1000; i++) {
  list.push({
    id: i,
    label: `item ${i}`,
    desc: `desc ${i}`,
    subtitle: Math.random() > 0.5 ? 'more content' : null,
  });
}

// ===============================================================
// Helper components
// ===============================================================
const DragHandle = SortableHandle(() => <span style={style.handle}>***</span>)

const dragRenderer = () => <DragHandle />;

const descRenderer = ({ rowData }) => {
  if (rowData.subtitle) {
    return <span>{rowData.desc}<br />{rowData.subtitle}</span>;
  } else {
    return <span>{rowData.desc}</span>;
  }
};

const rendererForSizeMeasurement = ({ item }) => descRenderer({ rowData: item });

const SortableFlexTable = SortableContainer(FlexTable, { withRef: true });
const SortableRow = SortableElement(defaultFlexTableRowRenderer);

// ===============================================================
// Main component
// ===============================================================
class Example extends Component {
  constructor() {
    super();
    this.state = { items: list };
    this.cachedHeights = {};
    this.onSortEnd = this.onSortEnd.bind(this);
  }

  // ===============================================================
  // Render
  // ===============================================================
  render() {
    return SIMPLIFIED_EXAMPLE ? this.renderSimplified() : this.renderNormal();
  }

  renderNormal() {
    console.log('Rendering list...')
    const { items } = this.state;
    return (
      <div style={style.outer}>
        <AutoSizer>
          {({ height, width }) => (
            <CellMeasurer
              cellRenderer={({ rowIndex }) => rendererForSizeMeasurement({ item: items[rowIndex] })}
              cellSizeCache={this}
              columnCount={1}
              rowCount={list.length}
              width={width}
            >
              {({ getRowHeight }) => (
                <SortableFlexTable
                  ref={c => { this.refSortableTable = c; }}
                  getContainer={(wrappedInstance) => ReactDOM.findDOMNode(wrappedInstance.Grid)}
                  onSortEnd={this.onSortEnd}
                  width={width}
                  height={height}
                  headerHeight={30}
                  rowCount={list.length}
                  rowHeight={getRowHeight}
                  rowGetter={({ index }) => list[index]}
                  rowRenderer={props => <SortableRow {...props}/>}
                >
                  <FlexColumn
                    label='Drag'
                    dataKey='dragHandle'
                    cellRenderer={dragRenderer}
                    width={50} flexShrink={0}
                  />
                  <FlexColumn label='Label' dataKey='label' width={100} />
                  <FlexColumn
                    label='Desc'
                    dataKey='desc'
                    cellRenderer={descRenderer}
                    width={200} flexGrow={1}
                  />
                </SortableFlexTable>
              )}
            </CellMeasurer>
          )}
        </AutoSizer>
      </div>
    );
  }

  renderSimplified() {
    console.log('Rendering list...')
    const { items } = this.state;
    const height = 400;
    const width = 500;
    return (
      <SortableFlexTable
        ref={c => { this.refSortableTable = c; }}
        getContainer={(wrappedInstance) => ReactDOM.findDOMNode(wrappedInstance.Grid)}
        onSortEnd={this.onSortEnd}
        width={width}
        height={height}
        headerHeight={30}
        rowCount={list.length}
        rowHeight={50}
        rowGetter={({ index }) => list[index]}
        rowRenderer={props => <SortableRow {...props}/>}
      >
        <FlexColumn label='Label' dataKey='label' width={100} />
        <FlexColumn
          label='Desc'
          dataKey='desc'
          cellRenderer={descRenderer}
          width={200} flexGrow={1}
        />
      </SortableFlexTable>
    );
  }

  // ===============================================================
  // Event handlers
  // ===============================================================
  onSortEnd({ oldIndex, newIndex }) {
    const { items } = this.state;
    console.log(`${oldIndex} -> ${newIndex}`);
    arrayMove(items, oldIndex, newIndex);
    this.setState({ items });
    const instance = this.refSortableTable.getWrappedInstance();
    instance.recomputeRowHeights();
    // instance.forceUpdate();
  }

  // ===============================================================
  // Height cache -- we implement it right in the component so that we can use
  // row ID as the key instead of the index. This way, re-sorting rows does not
  // require re-rendering to recalculate heights
  // ===============================================================
  clearAllColumnWidths() {}
  clearAllRowHeights() {
    console.log('clearAllRowHeights()');
    this.cachedHeights = {};
  }
  clearColumnWidth(index) {}
  clearRowHeight(index) {
    console.log(`clearRowHeight(${index})`);
    const id = this.state.items[index].id;
    this.cachedHeights[id] = undefined;
  }
  getColumnWidth (index) { return undefined; }
  getRowHeight (index) {
    // console.log(`getRowHeight(${index})`);
    const id = this.state.items[index].id;
    return this.cachedHeights[id];
  }
  hasColumnWidth (index) { return false; }
  hasRowHeight (index) {
    // console.log(`hasRowHeight(${index})`);
    const id = this.state.items[index].id;
    return this.cachedHeights[id] >= 0;
  }
  setColumnWidth (index, width) {}
  setRowHeight (index, height) {
    // console.log(`setRowHeight(${index}, ${height})`);
    const id = this.state.items[index].id;
    this.cachedHeights[id] = height;
  }
}

const style = {
  outer: {
    width: 500,
    height: 400,
    backgroundColor: 'lavender',
  },
  handle: {
    marginRight: 10,
    cursor: 'pointer',
  },
};

export default Example;
