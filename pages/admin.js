import Head from "next/head";
import Link from "next/link";
import { withAuthenticationRequired, useAuth0 } from "@auth0/auth0-react";
import { useLazyQuery } from "@apollo/client";
import { Loading } from "@icco/react-common";

import AdminPostList from "../components/AdminPostList";
import App from "../components/App";
import Header from "../components/Header";
import NotAuthorized from "../components/NotAuthorized";

const Page = (params) => {
  const { isLoading, error, isAuthenticated, user } = useAuth0();
  console.log(user);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || user.role !== "admin") {
    return <NotAuthorized />;
  }

  return (
    <App>
      <Head>
        <title>Nat? Nat. Nat! Admin</title>
      </Head>
      <Header noLogo />
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
        <AdminPostList type="drafts" />

        <h2>Future</h2>
        <AdminPostList type="future" />

        <h2>Published</h2>
        <AdminPostList type="published" />
      </div>
    </App>
  );
};

export default withAuthenticationRequired(Page);
