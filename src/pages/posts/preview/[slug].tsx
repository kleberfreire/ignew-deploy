import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";

import { getSession, useSession } from "next-auth/react";
import { RichText } from "prismic-dom";

import styles from "../post.module.scss";
import { createClient } from "../../../services/prismicio";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

interface IPost {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAT: string;
  };
}

export default function Post({ post }: IPost) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log(status);
    if (status === "authenticated") {
      router.push(`/posts/${post.slug}`);
    }
  }, [status]);

  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAT}</time>
          <div
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className={styles.continueReading}>
            Wanna continue reading ?
            <Link href="/">
              <a href="">Subscribe 🤗</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
}) => {
  const { slug } = params as any;

  const client = createClient({ previewData } as any);

  const response = await client.getByUID("post", String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.Title),
    content: RichText.asHtml(response.data.Content.splice(0, 3)),
    updatedAT: new Date(response.last_publication_date).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ),
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
