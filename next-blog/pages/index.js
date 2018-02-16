import Link from 'next/link';
import Navbar from '../components/navbar';

class Page extends React.Component {
  static getInitialProps({ query }) {
    return query;
  }
  render() {
    return (
      <div>
        <Navbar />
        <h2>Index ({this.props.query})</h2>
      </div>
    );
  }
}

export default Page;
