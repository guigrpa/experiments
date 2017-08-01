class AnimatedPath extends React.Component {
  render() {
    return (
      <div>
        <svg width={500} height={500}>
          <rect x={10} y={20} width={10} height={40} />
          <path d="M10,10L200,200" />
        </svg>
        <style jsx>{`
          rect {
            fill: blue;
          }
          path {
            stroke: red;
          }
        `}</style>
      </div>
    );
  }
}

export default AnimatedPath;
