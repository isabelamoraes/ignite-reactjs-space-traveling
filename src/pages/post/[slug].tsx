import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1 className={styles.load}>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, content) => {
    total += content.heading.split(' ').length;

    const totalBody = content.body.map(item => item.text.split(' ').length);
    totalBody.map(words => (total += words));

    return total;
  }, 0);

  const time = Math.ceil(totalWords / 200);

  function formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | traveling</title>
      </Head>

      <main>
        <div className={`${commonStyles.container} ${styles.header}`}>
          <Header />
        </div>

        <div>
          <div
            style={{
              backgroundImage: `url(${post.data.banner.url})`,
            }}
            className={styles.banner}
          />
        </div>

        <div className={commonStyles.container}>
          <article className={styles.post}>
            <h1>{post.data.title}</h1>
            <div>
              <div>
                <FiCalendar />
                <time>{formatDate(post.first_publication_date)}</time>
              </div>

              <div>
                <FiUser />
                <span>{post.data.author}</span>
              </div>

              <div>
                <FiClock />
                <time>{time} min</time>
              </div>
            </div>

            {post.data.content.map(content => {
              return (
                <article className={styles.content} key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </article>
              );
            })}
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
