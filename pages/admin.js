import Head from "next/head";
import React from "react";
import Error from "next/error";
import Link from "next/link";
import { Header } from "@icco/react-common";

import AdminDraftList from "../components/AdminDraftList";
import AdminPostList from "../components/AdminPostList";
import App from "../components/App";
import NotAuthorized from "../components/NotAuthorized";
import { checkLoggedIn } from "../lib/auth";
import { initApollo } from "../lib/init-apollo";

export default class extends React.Component {
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
      return <NotAuthorized />;
    }

    return (
      <App>
        <Head>
          <title>Nat? Nat. Nat! Admin</title>
        </Head>
        <Header noLogo loggedInUser={this.state.loggedInUser} />
        <div className="ma3">
          <h1>Admin</h1>
          <ul className="list pl0" key="new-ul">
            <li className="" key={"new-post"}>
              <Link as={"/admin/new"} href={"/admin/new"}>
                <a className="link dark-gray dim">New Post</a>
              </Link>
            </li>
          </ul>

          <h2>Drafts</h2>
          <AdminDraftList />

          <h2>Published</h2>
          <AdminPostList />
        </div>
      </App>
    );
  }
}
