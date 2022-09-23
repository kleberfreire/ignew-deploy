import Head from "next/head";
import { createClient } from "../../services/prismicio";
import Link from "next/link";

import { RichText } from "prismic-dom";

import styles from "./styles.module.scss";
import { PreviewData } from "next";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAT: string;
};

interface IPostsProps {
  posts: Post[];
}

export default function Posts({ posts }: IPostsProps) {
  if (!posts) {
    return null;
  }
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map((post) => (
            <Link href={`/posts/${post.slug}`} key={post.slug}>
              <a>
                <time>{post.updatedAT}</time>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

interface IPreviewData {
  previewData:PreviewData;
} 

export async function getStaticProps({ previewData }: IPreviewData) {
  const client = createClient({ previewData });

  const response = await client.getAllByType("post", {
    pageSize: 100,
  });

  const posts = response.map((post: any) => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.Title),
      excerpt:
        post.data.Content.find(
          (content: any) =>
            content.type === "paragraph" && content.text.length > 0
        )?.text ?? "",
      updatedAT: new Date(post.last_publication_date).toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      ),
    };
  });

  return {
    props: {
      posts: posts,
    },
  };
}
