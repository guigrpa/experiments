import Link from 'next/link';

export default () => {
  console.log(`rendering about... (baseUrl = ${process.env.BASE_URL})`);
  return (
    <div>
      <Link href="/" as={`${process.env.BASE_URL}/`}>
        <a>Home</a>
      </Link>
      {' | '}
      <Link href="/about" as={`${process.env.BASE_URL}/about`}>
        <a>About</a>
      </Link>
      {' | '}
      <Link href="/about?lang=es" as={`${process.env.BASE_URL}/es/about`}>
        <a>About (Spanish)</a>
      </Link>
    </div>
  );
};
