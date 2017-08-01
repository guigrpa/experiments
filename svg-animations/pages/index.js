class AnimatedPath extends React.Component {
  render() {
    return (
      <div>
        <svg width={500} height={500}>
          <rect x={10} y={20} width={10} height={40} />
          <path d="M30,10L230,10" />
        </svg>
        <style jsx>{`
          rect {
            fill: blue;
          }
          path {
            stroke: gray;
            stroke-width: 20;
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            stroke-linecap: round;
            animation: dash 2s linear forwards infinite;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>
    );
  }
}

export default AnimatedPath;
