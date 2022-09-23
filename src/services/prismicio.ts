import * as prismic from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import { NextApiRequest, PreviewData } from "next";
import sm from "../../sm.json";

interface IPrismicContext {
  req?: NextApiRequest;
  previewData: PreviewData;
}

interface IPrismicResolver {
  [key: string]: any;
}

interface IEnableAutoPreviewsProps {
  client: prismic.Client;
  previewData: PreviewData;
  req: NextApiRequest;
}

export const endpoint = sm.apiEndpoint;
export const repositoryName = prismic.getRepositoryName(endpoint);

// Update the Link Resolver to match your project's route structure
export function linkResolver(doc: IPrismicResolver) {
  switch (doc.type) {
    case "posts":
      return `/${doc.uid}`;
    default:
      return null;
  }
}

// This factory function allows smooth preview setup

export function createClient(config: IPrismicContext) {
  const client = prismic.createClient(endpoint, {
    ...config,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  } as IEnableAutoPreviewsProps);

  return client;
}
