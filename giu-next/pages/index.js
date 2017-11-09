import { LargeMessage, Floats, ColorInput, Icon } from 'giu';
import Head from 'next/head';

export default () => (
  <div>
    <Head>
      <title>My page title</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link
        rel="stylesheet"
        href="/static/font-awesome/css/font-awesome.min.css"
      />
    </Head>
    <Floats />
    <ColorInput />
    <Icon icon="cogs" />
  </div>
);
