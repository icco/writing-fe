import { useRouter } from "next/router";
import gql from "graphql-tag";
import { withApollo } from "@icco/react-common";

import App from "../../components/App";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Post from "../../components/Post";

const Page = props => {
  const router = useRouter();
  if (router == null) {
    return <></>;
  }
  const { pid } = router.query;
  return (
    <App>
      <Header noLogo />
      <Post id={pid} comments />
      <Footer />
    </App>
  );
};

export default withApollo(Page);
