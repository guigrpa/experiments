// ---------------------------------------------
// Example with drag handles, variable-height elements (height defined by contents)
// ---------------------------------------------
import React, {Component} from 'react';
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  arrayMove,
} from 'react-sortable-hoc';

const ITEMS = [1, 2, 3, 4, 5].map(n => ({
  label: `Item ${n}`,
  subtitle: Math.random() > 0.5 ? 'x' : null,
  // style: { height: 20 + Math.random() * 70 },
}));

const DragHandle = SortableHandle(() => <span style={styles.dragHandle}>#</span>);

const SortableItem = SortableElement(({ item }) =>
  <div style={item.style}>
    <DragHandle />
    {item.label}
    {item.subtitle ? <span><br />{item.subtitle}</span> : null}
  </div>
);

const SortableList = SortableContainer(({ items }) => {
	return (
		<div style={styles.outer}>
			{items.map((item, index) =>
        <SortableItem key={`item-${index}`} index={index} item={item} />
      )}
		</div>
	);
});

class SortableComponent extends Component {
  state = { items: ITEMS };
  render() {
    return (
      <SortableList
        items={this.state.items}
        onSortEnd={this.onSortEnd}
        useDragHandle={true}
      />
    );
  }
  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      items: arrayMove(this.state.items, oldIndex, newIndex),
    });
  };
}

const styles = {
  outer: {
    backgroundColor: 'lavender',
    width: 200,
  },
  dragHandle: {
    marginRight: 10,
    cursor: 'pointer',
  },
};

export default SortableComponent;
