# Shopify Scraper

A Node.js application for scraping product data from Shopify stores using HyperBrowser and OpenAI.

## Features

- Scrape product information from Shopify stores
- Extract product names, prices, descriptions, and images
- Uses HyperBrowser for reliable web scraping
- Integrates with OpenAI for data processing

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- HyperBrowser API key
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/shopify-scraper.git
cd shopify-scraper
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Run the application:

```bash
yarn build
yarn start scrape <shopify-url>
yarn start extract <job-id>
```

## Notes

- The `scrape` command will start a crawl job and print the job ID.
- The `extract` command will extract the product data from the crawl job and print the extracted data.
