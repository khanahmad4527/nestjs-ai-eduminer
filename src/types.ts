export type ScrapeSource = 'ck12' | 'pbs' | 'khanacademy';

export type ScrapedItem = {
  title: string;
  description: string | null;
  link: string | null;
  image: string | null;
  grade: string | null;
  type: string | null;
  source: ScrapeSource;
};

export type AgentScrapeProps = {
  query: string;
  grade?: string | null;
  paginationPage: number;
};
