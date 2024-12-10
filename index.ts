import { config } from "dotenv";
import Hyperbrowser from "@hyperbrowser/sdk";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HYPERBROWSER_API_KEY = process.env.HYPERBROWSER_API_KEY || "";

const client = new Hyperbrowser({
  apiKey: HYPERBROWSER_API_KEY,
});

const Product = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
  image: z.string(),
});

const ProductSchema = z.object({ products: z.array(Product) });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeShopifySite = async (url: string) => {
  const crawlJob = await client.startCrawlJob({
    url: url,
    maxPages: 1000,
    followLinks: false,
    excludePatterns: [],
    includePatterns: [],
    useProxy: false,
    solveCaptchas: false,
  });

  console.log("Crawl job started: ", crawlJob.jobId);

  let completed = false;
  while (!completed) {
    const job = await client.getCrawlJob(crawlJob.jobId);

    if (job.status === "completed") {
      completed = true;
      console.log("Crawl job completed: ", crawlJob.jobId);
    } else if (job.status === "failed") {
      console.error("Crawl job failed: ", job.error);
      completed = true;
    } else {
      console.log("Crawl job is still running: ", job.status);
      await sleep(5_000);
    }
  }
};

const extractProductData = async (jobId: string) => {
  let scrapedMarkdown = "";
  let pageIndex = 1;
  while (true) {
    const crawlJobResult = await client.getCrawlJob(jobId, {
      page: pageIndex,
      batchSize: 10,
    });

    const pages = crawlJobResult.data;
    if (pages) {
      for (const page of pages) {
        const pageData = page.markdown;
        if (pageData) {
          scrapedMarkdown += pageData;
        }
      }
      if (pageIndex >= crawlJobResult.totalPageBatches) {
        break;
      }
      pageIndex++;
    }
  }

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert data extractor. Your task is to extract product information from the provided scraped content. 
                Ensure the output adheres to the following structure:
                - Name: Product name
                - Description: A brief description of the product
                - Price: The price in the provided currency (if available)
                - Availability: Whether the product is in stock or out of stock (if available)
                - Additional Details: Any other relevant information (e.g., SKU, category)

                Provide the extracted data as a JSON object. Parse the Markdown content carefully to identify and categorize the product details accurately.`,
      },
      { role: "user", content: scrapedMarkdown },
    ],
    response_format: zodResponseFormat(ProductSchema, "product"),
  });

  const productInfo = completion.choices[0].message.parsed;
  console.log("Products:", productInfo);
};
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

if (!command) {
  console.error("Please provide a command: scrape <url> or extract <jobId>");
  process.exit(1);
}

if (command === "scrape") {
  if (!param) {
    console.error("Please provide a URL to scrape");
    process.exit(1);
  }
  scrapeShopifySite(param);
} else if (command === "extract") {
  if (!param) {
    console.error("Please provide a job ID to extract data from");
    process.exit(1);
  }
  extractProductData(param);
} else {
  console.error("Invalid command. Use 'scrape <url>' or 'extract <jobId>'");
  process.exit(1);
}
