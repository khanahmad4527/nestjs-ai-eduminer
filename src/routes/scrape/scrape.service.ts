import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { GradeOption, ScrapeQueryDto } from './dto/scrape-query.dto';
import { AgentScrapeProps, ScrapedItem, ScrapeSource } from 'src/types';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const randomUseragent = require('random-useragent'); // does not support es6 import

@Injectable()
export class ScrapeService {
  private readonly logger = new Logger(ScrapeService.name);

  private browser: Promise<Browser>;

  constructor(private configService: ConfigService) {}

  async scrapeAllSources(queryParams: ScrapeQueryDto) {
    const { page, grade, q, allowAIProcessing } = queryParams;

    this.browser = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,720',
      ],
    });

    const pbsGrade = this.normalizeGradeForPBS(grade);
    const ck12Grade = this.normalizeGradeForCK12(grade);

    try {
      const [pbs, khan, ck12] = await Promise.all([
        this.scrapePBS({ grade: pbsGrade, query: q, paginationPage: page }),
        this.scrapeKhanAcademy({ grade, query: q, paginationPage: page }),
        this.scrapeCK12({ grade: ck12Grade, query: q, paginationPage: page }),
      ]);

      const data = [...pbs, ...khan, ...ck12] as ScrapedItem[];

      if (allowAIProcessing) {
        return await this.scoreScrapedItems({ q, grade, items: data });
      }

      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  // Grade normalization function
  private normalizeGrade = (gradeText?: string | null) => {
    if (!gradeText) return null;
    const match = gradeText.match(/(\d+)/);
    return match ? match[1] : null;
  };

  private normalizeGradeForPBS = (grade: ScrapeQueryDto['grade']) => {
    if (!grade || grade === 'all') return null; // PBS allows searching without a grade filter

    if (grade === 'K') return 'PreK-K';
    const numGrade = parseInt(grade, 10);

    if (!isNaN(numGrade)) {
      if (numGrade <= 2) return 'K-2';
      if (numGrade <= 5) return '3-5';
      if (numGrade <= 8) return '6-8';
      if (numGrade <= 12) return '9-12';
    }

    return null; // PBS only supports up to grade 12
  };

  private normalizeGradeForCK12 = (grade: ScrapeQueryDto['grade']) => {
    if (!grade || grade === 'all') return null; // CK-12 allows searching without a grade filter

    if (grade === 'K') return null; // CK-12 doesn't support Kindergarten
    const numGrade = parseInt(grade, 10);

    if (!isNaN(numGrade) && numGrade >= 1 && numGrade <= 10) {
      return encodeURIComponent(numGrade.toString()); // CK-12 uses URL encoding (e.g., 1 -> "1", 2 -> "2")
    }

    return null; // CK-12 only supports grades 1-10
  };

  // Khan Academy Scraper
  private scrapeKhanAcademy = async ({
    query,
    paginationPage,
  }: AgentScrapeProps) => {
    const browser = await this.browser;
    const page = await browser.newPage();

    try {
      await page.setJavaScriptEnabled(true);
      await page.setUserAgent(randomUseragent.getRandom());
      await page.setViewport({ width: 1280, height: 720 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      const url = `https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(query)}&page=${paginationPage}`;

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      // Wait for results to load
      await page.waitForSelector('._16owliz9', { timeout: 10000 });

      const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('._16owliz9') ?? []).map(
          (item) => {
            const titleElement = item.querySelector('._2dibcm7, ._1wg3dpea');
            const title = titleElement?.textContent?.trim() ?? 'No title';

            // Improved description extraction
            const descriptionElement = item.querySelector(
              '._1n941cdr, ._2dibcm7 + div',
            );
            const description = descriptionElement?.textContent?.trim() ?? null;

            // Get absolute URL
            const relativeLink = (
              item.querySelector('a._1wg3dpea') as HTMLAnchorElement
            )?.href;
            const link = relativeLink
              ? new URL(relativeLink, 'https://www.khanacademy.org').href
              : null;

            const type =
              item
                .querySelector('._1ufuji7')
                ?.textContent?.trim()
                ?.toLowerCase() ?? null;

            // Improved image extraction
            let image: string | null = null;
            const imgElement = item.querySelector(
              'img:not([src*="data:image"])',
            ) as HTMLImageElement | null;
            if (imgElement) {
              image = imgElement.src.startsWith('//')
                ? `https:${imgElement.src}`
                : imgElement.src;
            }

            return {
              title,
              description,
              link,
              image,
              grade: null, // Khan Academy doesn't show grades in search results
              type,
              source: 'khanacademy' as ScrapeSource,
            };
          },
        );
      });

      return results;
    } catch (error) {
      this.logger.error('Khan Academy Scraper Error:', error);
    } finally {
      await page
        .close()
        .catch((e) => this.logger.error('Error closing page:', e));
    }

    return [];
  };

  // PBS Learning Media Scraper
  private scrapePBS = async ({
    query,
    grade,
    paginationPage,
  }: AgentScrapeProps) => {
    const browser = await this.browser;
    const page = await browser.newPage();

    try {
      await page.setJavaScriptEnabled(true);
      await page.setUserAgent(randomUseragent.getRandom());
      await page.setViewport({ width: 1280, height: 720 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      const url = `https://www.pbslearningmedia.org/search/?q=${encodeURIComponent(query)}&selected_filters=grade:${grade}&page=${paginationPage}`;

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 40000,
      });

      // Wait for results to load
      await page.waitForSelector('.search-items .search-item', {
        timeout: 10000,
      });

      const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.search-item') ?? []).map(
          (item) => {
            const title =
              item.querySelector('.card-title')?.textContent?.trim() ??
              'No title';
            const description =
              item.querySelector('.card-description')?.textContent?.trim() ??
              null;

            // Get absolute URL
            const relativeLink = (
              item.querySelector('a[href^="/resource/"]') as HTMLAnchorElement
            )?.href;
            const link = relativeLink
              ? new URL(relativeLink, 'https://www.pbslearningmedia.org').href
              : null;

            // Improved grade extraction
            const gradeText =
              item
                .querySelector('.grades')
                ?.textContent?.replace('Grades', '')
                .trim() ?? '';
            const grades = gradeText.split(/[,&]/).map((g) => g.trim());

            // Improved image extraction
            let image: string | null = null;
            const img = item.querySelector(
              '.poster-image:not([src*=".svg"])',
            ) as HTMLImageElement | null;
            if (img) {
              image =
                img.src ??
                (img.style.backgroundImage
                  ?.replace(/^url\(["']?/, '')
                  .replace(/["']?\)$/, '') as string);
              if (image && image.startsWith('//')) {
                image = `https:${image}`;
              }
            }
            const typeElement = item.querySelector(
              '.media-type.selenium-card-media-type .text',
            );
            const type = typeElement
              ? typeElement?.textContent?.trim()?.toLowerCase()
              : null;

            return {
              title,
              description,
              link,
              image,
              grade: grades.length > 0 ? grades[0] : null, // Take first grade if multiple
              type,
              source: 'pbs' as ScrapeSource,
            };
          },
        );
      });

      const processedResults = results.map((item) => ({
        ...item,
        grade: this.normalizeGrade(item.grade),
      }));

      return processedResults;
    } catch (error) {
      this.logger.error('PBS Scraper Error:', error);
    } finally {
      await page
        .close()
        .catch((e) => this.logger.error('Error closing page:', e));
    }

    return [];
  };

  // CK-12 Scraper
  private scrapeCK12 = async ({
    query,
    grade,
    paginationPage,
  }: AgentScrapeProps) => {
    const browser = await this.browser;
    const page = await browser.newPage();

    try {
      await page.setJavaScriptEnabled(true);
      await page.setUserAgent(randomUseragent.getRandom());
      await page.setViewport({ width: 1280, height: 720 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      const url = `https://www.ck12.org/search/?referrer=search&pageNum=${paginationPage}&tabId=communityContributedContentTab&gradeFilters=${grade}&q=${encodeURIComponent(query)}`;

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      await page.waitForSelector(
        '.contentListItemStyles__Container-sc-5gkytp-0',
        {
          timeout: 10000,
        },
      );

      const results = await page.evaluate(() => {
        const items = Array.from(
          document.querySelectorAll(
            '.contentListItemStyles__Container-sc-5gkytp-0',
          ) ?? [],
        );

        return items.map((item) => {
          return {
            title: item.querySelector('a')?.textContent?.trim() ?? null,
            image:
              (
                item.querySelector(
                  'img:not([src*="placeholder"])',
                ) as HTMLImageElement
              )?.src ?? null,
            description:
              item
                .querySelector(
                  '.contentListItemStyles__TextContainer-sc-5gkytp-1 > div:nth-child(2)',
                )
                ?.textContent?.trim() ?? null,
            grade: item
              .querySelector(
                '.ContentListItem__ListItem-sc-8bx8mv-1:nth-child(1)',
              )
              ?.textContent?.replace('Grade:', '')
              .trim(),
            link: item.querySelector('a')?.href ?? null,
            type: null,
            source: 'ck12' as ScrapeSource,
          };
        });
      });

      const processedResults = results.map((item) => ({
        ...item,
        grade: this.normalizeGrade(item.grade),
      }));

      return processedResults;
    } catch (error) {
      this.logger.error('CK12 Scraper Error:', error);
    } finally {
      await page
        .close()
        .catch((e) => this.logger.error('Error closing page:', e));
    }

    return [];
  };

  /**
   * Function to assign relevance scores to scraped items using DeepSeek LLM.
   */
  private scoreScrapedItems = async ({
    q,
    grade,
    items,
  }: {
    q: string;
    grade?: GradeOption;
    items: ScrapedItem[];
  }): Promise<{ items: ScrapedItem[] }> => {
    console.log('LLM Processing');
    // Improved system prompt with example irrelevant data and strict output format
    const systemPrompt = `You are an intelligent evaluator that assigns a relevance score (1-10) to a list of educational resources based on:
  1. How well they match the user's query.
  2. How complete the data is (title, description, link, image, grade, and type).
  3. Whether the content is suitable for the specified grade.

  - If an item is completely unrelated, assign a low score (1-3).
  - If an item is somewhat related but lacks key details, assign a moderate score (4-6).
  - If an item is highly relevant and well-structured, assign a high score (7-10).

  ### Example of Irrelevant Data:
  - Query: "volcano"
  - Example Irrelevant Item: { "title": "Cooking with Fire", "description": "A guide to cooking techniques over open flames." }

  ### Expected Output Format:
  Return only a JSON array, structured like this:
  [
    {
      "title": "...",
      "description": "...",
      "link": "...",
      "image": "...",
      "grade": "...",
      "type": "...",
      "source": "...",
      "relevance_score": 5
    },
    ...
  ]`;

    const userPrompt = `User search query: "${q}"  
  Target grade level: "${grade}"  

  Scraped items:  
  ${JSON.stringify(items, null, 2)}

  Return an array of the same items but with an additional field "relevance_score" (integer 1-10).`;

    const DEEPSEEK_API_KEY = this.configService.get<string>('DEEPSEEK_API_KEY');

    try {
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: DEEPSEEK_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' }, // <-- Add this to force JSON response
        stream: false,
      });

      const responseContent = completion.choices[0].message.content;

      if (!responseContent) {
        throw new Error('Could not parse LLM response as JSON');
      }

      // Handle both possible response formats:
      let scoredItems;
      try {
        // First try parsing directly as JSON
        scoredItems = JSON.parse(responseContent);
      } catch (error) {
        throw error;
      }

      return scoredItems;
    } catch (error) {
      this.logger.error(
        'Error fetching relevance scores from DeepSeek:',
        error,
      );
      throw new Error('Failed to fetch relevance scores.');
    }
  };
}
