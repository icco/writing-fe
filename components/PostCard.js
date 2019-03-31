import Link from "next/link";

export default ({ className, post }) => {
  return (
    <article
      className={
        className + " br2 ba dark-gray b--black-10 w-100 w-50-m w-25-l mw5"
      }
    >
      <div className="pa2 ph3-ns pb3-ns">
        <div className="dt w-100 mt1">
          <div className="dtc">
            <h1 className="f5 f4-ns mv0">
              <Link
                prefetch
                as={`/post/${post.id}`}
                href={`/post?id=${post.id}`}
              >
                <a className="link dark-gray dim">{post.title}</a>
              </Link>
            </h1>
          </div>
        </div>
        <p className="f6 lh-copy measure mt2 mid-gray">{post.summary}</p>
      </div>
    </article>
  );
};
