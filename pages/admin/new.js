import Router from "next/router";
import { gql, Mutation } from "@apollo/client";
import { Loading, ErrorMessage } from "@icco/react-common";
import { withAuthenticationRequired } from "@auth0/auth0-react";

import NotAuthorized from "../../components/NotAuthorized";

const NewPost = gql`
  mutation {
    createPost(input: { draft: true }) {
      id
    }
  }
`;

const Page = (props) => {
  return (
    <Mutation mutation={NewPost}>
      {(newPost, { loading, error, data }) => {
        if (loading) {
          return <Loading key={0} />;
        }
        if (error) {
          return <ErrorMessage error={error} message="Page not found." />;
        }

        if (data) {
          Router.push(`/edit/${data.createPost.id}`);
        } else {
          newPost();
        }
        return null;
      }}
    </Mutation>
  );
};

export default withAuthenticationRequired(Page);
