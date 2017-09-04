class AnimatedPath extends React.Component {
  render() {
    return (
      <div>
        <svg width={500} height={500}>
          <rect x={10} y={20} width={10} height={40} />
          <path d="M10,10L310,10" />
        </svg>
        <style jsx>{`
          rect {
            fill: blue;
          }
          path {
            stroke: red;
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            animation: dash 2s linear forwards;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: 250;
            }
          }
        `}</style>
      </div>
    );
  }
}

export default AnimatedPath;
