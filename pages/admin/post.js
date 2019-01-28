import Error from "next/error";
import Head from "next/head";
import React from "react";
import { withRouter } from "next/router";

import AdminLinkList from "../../components/AdminLinkList";
import App from "../../components/App";
import EditPost from "../../components/EditPost";
import Header from "../../components/Header";
import { checkLoggedIn } from "../../lib/auth";
import { initApollo } from "../../lib/init-apollo";

class AdminPost extends React.Component {
  async componentDidMount() {
    const { loggedInUser } = await checkLoggedIn(initApollo());
    this.setState({ loggedInUser });
  }

  render() {
    if (
      !this.state ||
      !this.state.loggedInUser ||
      !this.state.loggedInUser.role ||
      this.state.loggedInUser.role !== "admin"
    ) {
      return <Error statusCode={403} />;
    }

    return (
      <App>
        <Head>
          <title>Nat? Nat. Nat! Edit Post #{this.props.router.query.id}</title>
        </Head>
        <Header noLogo={true} loggedInUser={this.state.loggedInUser} />
        <EditPost id={this.props.router.query.id} />
        <AdminLinkList />
      </App>
    );
  }
}

export default withRouter(AdminPost);