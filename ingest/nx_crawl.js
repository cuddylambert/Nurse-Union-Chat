#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { pipeline } = require('stream/promises');
const cheerio = require('cheerio');

const BASE_URL =
  'https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/registered-nurses/contract/';
const OUTPUT_DIR = path.resolve(__dirname, '../data/raw/nx');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const unionArgIndex = process.argv.findIndex((arg) => arg === '--union');
const unionCode = unionArgIndex >= 0 ? process.argv[unionArgIndex + 1] : 'NX';

if (unionCode.toUpperCase() !== 'NX') {
  console.error(`Unsupported union code: ${unionCode}`);
  process.exit(1);
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function downloadToFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const tempPath = `${filePath}.tmp`;
  const writeStream = fs.createWriteStream(tempPath);
  await pipeline(response.body, writeStream);
  await fs.promises.rename(tempPath, filePath);
}

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function crawlLinks() {
  console.log(`Fetching contract index page: ${BASE_URL}`);
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      console.warn(`Unable to reach ${BASE_URL}. Status: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const links = new Set();

    $('a[href$=".pdf"]').each((_idx, element) => {
      const href = $(element).attr('href');
      if (!href) {
        return;
      }
      const absoluteUrl = new URL(href, BASE_URL).href;
      links.add(absoluteUrl);
    });

    return Array.from(links);
  } catch (error) {
    console.warn(`Error crawling links: ${error.message}`);
    return [];
  }
}

async function loadExistingManifest() {
  try {
    const data = await fs.promises.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeManifest(entries) {
  await fs.promises.writeFile(MANIFEST_PATH, JSON.stringify(entries, null, 2));
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const links = await crawlLinks();

  if (links.length === 0) {
    console.warn('No remote links discovered. Using previously downloaded files if available.');
    const manifest = await loadExistingManifest();
    console.log(`Existing files: ${manifest.length}`);
    return;
  }

  console.log(`Discovered ${links.length} PDF links.`);
  const existingManifest = await loadExistingManifest();
  const manifestByUrl = new Map(existingManifest.map((entry) => [entry.url, entry]));
  const nextManifest = [];

  for (const link of links) {
    const fileName = path.basename(new URL(link).pathname) || `document-${nextManifest.length + 1}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const previous = manifestByUrl.get(link);

    if (previous) {
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile()) {
          nextManifest.push(previous);
          continue;
        }
      } catch (error) {
        // File missing, continue to download
      }
    }

    console.log(`Downloading ${link}`);
    await downloadToFile(link, filePath);
    const buffer = await fs.promises.readFile(filePath);
    const hash = hashBuffer(buffer);

    const entry = {
      unionCode: 'NX',
      url: link,
      fileName,
      bytes: buffer.length,
      sha256: hash,
      downloadedAt: new Date().toISOString()
    };

    nextManifest.push(entry);
  }

  await writeManifest(nextManifest);
  console.log('Ingestion complete. Files downloaded:');
  for (const entry of nextManifest) {
    console.log(`- ${entry.fileName} (${entry.sha256.slice(0, 12)}…)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
