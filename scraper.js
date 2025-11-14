/**
 * Enhanced Web Scraper for tunisie-annonce.com
 * Extracts real estate listings, follows links, and saves HTML to MongoDB
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');
const url = require('url');

class EnhancedTunisieAnnonceScraper {
  constructor(
    baseUrl = 'http://www.tunisie-annonce.com/AnnoncesImmobilier.asp',
    mongoUri = 'mongodb://localhost:27017/',
    dbName = 'tunisie_annonces'
  ) {
    this.baseUrl = baseUrl;
    this.detailsBaseUrl = 'http://www.tunisie-annonce.com/';
    this.mongoUri = mongoUri;
    this.dbName = dbName;
    this.listings = [];
    this.client = null;
    this.db = null;
    this.watermark = null; // Track the watermark listing (cod_ann)
    
    // Axios instance with headers
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
  }

  /**
    * Initialize MongoDB connection
    */
  async initMongoDB() {
    try {
      this.client = new MongoClient(this.mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      
      await this.client.connect();
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db(this.dbName);
      console.log(`✓ Connected to MongoDB database: ${this.dbName}`);
      
      // Create indexes
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('listing_details')) {
        await this.db.createCollection('listing_details');
      }
      
      if (!collectionNames.includes('scrape_metadata')) {
        await this.db.createCollection('scrape_metadata');
      }
      
      await this.db.collection('listing_details').createIndex({ cod_ann: 1 });
      await this.db.collection('scrape_metadata').createIndex({ key: 1 });
      
      // Load watermark from metadata
      await this.loadWatermark();
      
      return true;
    } catch (error) {
      console.log(`✗ Warning: MongoDB not available. Will save to JSON/CSV only.`);
      return false;
    }
  }

  /**
   * Load the watermark from metadata collection
   */
  async loadWatermark() {
    if (!this.db) return;
    
    try {
      const metadata = await this.db
        .collection('scrape_metadata')
        .findOne({ key: 'last_watermark' });
      
      if (metadata && metadata.cod_ann) {
        this.watermark = metadata.cod_ann;
        console.log(`✓ Loaded watermark: ${this.watermark}`);
      } else {
        console.log(`✓ No watermark found (first run)`);
      }
    } catch (error) {
      console.error(`Error loading watermark: ${error.message}`);
    }
  }

  /**
   * Save the watermark to metadata collection
   */
  async saveWatermark(codAnn) {
    if (!this.db || !codAnn) {
      console.log(`⚠ Cannot save watermark: db=${!!this.db}, codAnn=${codAnn}`);
      return;
    }
    
    try {
      const result = await this.db
        .collection('scrape_metadata')
        .updateOne(
          { key: 'last_watermark' },
          { $set: { cod_ann: codAnn, updated_at: new Date() } },
          { upsert: true }
        );
      console.log(`✓ Saved watermark: ${codAnn} (upserted: ${result.upsertedId ? 'yes' : 'no'})`);
    } catch (error) {
      console.error(`Error saving watermark: ${error.message}`);
    }
  }

  /**
   * Fetch a single page of listings
   */
  async fetchPage(pageNum = 1) {
    try {
      const response = await this.axiosInstance.get(this.baseUrl, {
        params: { rech_page_num: pageNum }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching page ${pageNum}: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse a single listing row from the HTML table
   */
  parseListing(row, $) {
    try {
      const cells = $(row).find('td');
      
      if (cells.length < 13) {
        return null;
      }

      const location = $(cells[1]).text().trim();
      const nature = $(cells[3]).text().trim();
      const propertyType = $(cells[5]).text().trim();
      
      const titleLink = $(cells[7]).find('a');
      const title = titleLink.text().trim();
      const link = titleLink.attr('href') || '';
      
      const priceText = $(cells[9]).text().trim().replace(/\xa0/g, '');
      const price = priceText || '';
      
      const dateText = $(cells[11]).text().trim();
      
      const cellsHtml = $(cells[7]).html();
      const isProfessional = cellsHtml.includes('icon_pro');
      const hasPhoto = cellsHtml.includes('icon_camera');
      
      // Extract cod_ann from link
      let codAnn = null;
      if (link.includes('cod_ann=')) {
        codAnn = link.split('cod_ann=')[1].split('&')[0];
        // Ensure codAnn is not empty
        if (!codAnn || codAnn.trim() === '') {
          codAnn = null;
        }
      }
      
      return {
        cod_ann: codAnn,
        location,
        nature,
        type: propertyType,
        title,
        link,
        price,
        date_modified: dateText,
        has_photo: hasPhoto,
        is_professional: isProfessional,
        scrape_date: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error parsing listing: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch the detailed HTML of a single listing
   */
  async fetchListingDetails(link) {
    try {
      const fullUrl = url.resolve(this.detailsBaseUrl, link);
      const response = await this.axiosInstance.get(fullUrl);
      return response.data;
    } catch (error) {
      console.error(`Error fetching listing details: ${error.message}`);
      return null;
    }
  }

  /**
    * Normalize phone number by extracting just the digits
    */
   normalizePhoneNumber(phone) {
     if (!phone) return null;
     
     // Extract only digits and + sign
     const cleaned = phone.replace(/[^\d+]/g, '');
     
     // Remove + if present (we'll standardize to digit-only format)
     const digitsOnly = cleaned.replace(/\D/g, '');
     
     // Count digits
     const digitCount = digitsOnly.length;
     
     // Valid if exactly 8 or 10 digits (8 + 216 prefix)
     if (digitCount === 8) {
       return digitsOnly;
     } else if (digitCount === 10 && digitsOnly.startsWith('216')) {
       // Normalize to 8-digit format
       return digitsOnly.substring(2);
     }
     
     return null;
   }

  /**
    * Extract phone numbers from HTML
    */
   extractPhoneNumbers(html) {
     if (!html) return [];
     
     const $ = cheerio.load(html);
     const phones = new Set(); // Use Set for automatic deduplication
     
     // Match phone patterns including spaced ones
     // Supports: +216XXXXXXXX, 0XXXXXXXXX, 216XXXXXXXX, XX XXX XXX, XX XX XX XX, etc.
     const phoneRegex = /(\+?216\s?\d{1}\s?\d{1}\s?\d{2}\s?\d{2}\s?\d{2}|0\s?\d{1}\s?\d{1}\s?\d{2}\s?\d{2}\s?\d{2}|216\s?\d{1}\s?\d{1}\s?\d{2}\s?\d{2}\s?\d{2}|\d{1}\s?\d{1}\s?\d{2}\s?\d{2}\s?\d{2}|\+?216\d{8}|0\d{8}|216\d{8}|\b\d{8}\b)/g;
     
     // Look for phone spans with da_contact_value class (most reliable)
     $('span.da_contact_value').each((i, el) => {
       const text = $(el).text().trim();
       if (text) {
         const normalized = this.normalizePhoneNumber(text);
         if (normalized) {
           phones.add(normalized);
         }
       }
     });
     
     // Also look for phone links (tel: protocol)
     $('a[href^="tel:"]').each((i, el) => {
       const telLink = $(el).attr('href');
       const phone = telLink.replace('tel:', '').trim();
       if (phone) {
         const normalized = this.normalizePhoneNumber(phone);
         if (normalized) {
           phones.add(normalized);
         }
       }
     });
     
     // Look for phone spans/divs with common classes
     $('[class*="phone"], [id*="phone"], [class*="contact"]').each((i, el) => {
       const text = $(el).text().trim();
       if (text) {
         const normalized = this.normalizePhoneNumber(text);
         if (normalized) {
           phones.add(normalized);
         }
       }
     });
     
     // Search in text content as last resort
     const bodyText = $('body').text();
     const matches = bodyText.match(phoneRegex);
     
     if (matches) {
       matches.forEach(match => {
         const normalized = this.normalizePhoneNumber(match);
         if (normalized) {
           phones.add(normalized);
         }
       });
     }
     
     // Convert Set back to Array
     return Array.from(phones);
   }

  /**
   * Check if image URL matches the desired pattern (upload2/...../photos/....)
   */
  isValidImageUrl(imageUrl) {
    if (!imageUrl) return false;
    // Only accept URLs with /upload2/ and /photos/ pattern
    return imageUrl.includes('/upload2/') && imageUrl.includes('/photos/');
  }

  /**
   * Extract image URLs from HTML
   */
  extractImageUrls(html) {
    if (!html) return [];
    
    const $ = cheerio.load(html);
    const images = [];
    
    // Find all img tags
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Convert relative URLs to absolute
        const absoluteUrl = url.resolve(this.detailsBaseUrl, src);
        if (this.isValidImageUrl(absoluteUrl) && !images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      }
    });
    
    // Also look for images in data attributes (lazy loading)
    $('[data-src], [data-image], [data-photo]').each((i, el) => {
      const dataSrc = $(el).attr('data-src') || 
                      $(el).attr('data-image') || 
                      $(el).attr('data-photo');
      if (dataSrc) {
        const absoluteUrl = url.resolve(this.detailsBaseUrl, dataSrc);
        if (this.isValidImageUrl(absoluteUrl) && !images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      }
    });
    
    // Look for images in picture elements
    $('picture source').each((i, el) => {
      const srcset = $(el).attr('srcset');
      if (srcset) {
        // srcset can have multiple URLs, extract the first one
        const firstUrl = srcset.split(',')[0].split(' ')[0].trim();
        const absoluteUrl = url.resolve(this.detailsBaseUrl, firstUrl);
        if (this.isValidImageUrl(absoluteUrl) && !images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      }
    });
    
    return images;
  }

  /**
   * Save listing and its HTML to MongoDB
   */
  async saveListingToMongoDB(listing, html) {
    if (!this.db) {
      return false;
    }

    try {
      const codAnn = listing.cod_ann;
      if (!codAnn) {
        console.log(`    ✗ Cannot save listing without cod_ann`);
        return false;
      }

      // Extract phone numbers and images from HTML
      const phoneNumbers = this.extractPhoneNumbers(html);
      const imageUrls = this.extractImageUrls(html);

      const listingWithHtml = {
        ...listing,
        html,
        phone_numbers: phoneNumbers,
        image_urls: imageUrls,
        image_count: imageUrls.length,
        phone_count: phoneNumbers.length,
        saved_date: new Date()
      };

      await this.db.collection('listing_details').updateOne(
        { cod_ann: codAnn },
        { $set: listingWithHtml },
        { upsert: true }
      );
      
      return true;
    } catch (error) {
      console.error(`Error saving to MongoDB: ${error.message}`);
      return false;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
    * Scrape all listings from a single page and fetch their details
    * Stops at watermark if reached
    */
  async scrapePage(pageNum = 1) {
    const html = await this.fetchPage(pageNum);
    if (!html) {
      return { count: 0, hitWatermark: false };
    }

    const $ = cheerio.load(html);
    const rows = $('tr.Tableau1');
    
    let count = 0;
    let hitWatermark = false;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const listing = this.parseListing(row, $);
      
      if (listing && listing.cod_ann) {  // Only process listings with valid cod_ann
        // Debug: log cod_ann
        if (count < 3 || (this.watermark && listing.cod_ann === this.watermark)) {
          const match = this.watermark && listing.cod_ann === this.watermark;
          const matchChar = match ? '✓ MATCH' : '        ';
          console.log(`    [${matchChar}] cod_ann: ${listing.cod_ann}, watermark: ${this.watermark}`);
        }
        
        // Check if we hit the watermark
        if (this.watermark && listing.cod_ann === this.watermark) {
          console.log(`\n  ⚠ Reached watermark: ${this.watermark}. Stopping scrape.\n`);
          hitWatermark = true;
          break;
        }
        
        this.listings.push(listing);
        
        const link = listing.link;
        if (link) {
          console.log(`  → Fetching details: ${listing.title}`);
          const detailsHtml = await this.fetchListingDetails(link);
          
          if (detailsHtml) {
            const saved = await this.saveListingToMongoDB(listing, detailsHtml);
            if (saved) {
              const phones = this.extractPhoneNumbers(detailsHtml);
              const images = this.extractImageUrls(detailsHtml);
              console.log(`    ✓ Saved to MongoDB (${phones.length} phones, ${images.length} images)`);
            } else {
              console.log(`    - Not saved (MongoDB unavailable)`);
            }
          }
          
          await this.sleep(500); // Be respectful to the server
        }
        
        count++;
      }
    }
    
    return { count, hitWatermark };
  }

  /**
    * Scrape latest 5 pages (or until watermark is reached)
    */
  async scrapeMultiplePages(numPages = 5) {
    console.log(`\nStarting scrape of latest ${numPages} pages...`);
    if (this.watermark) {
      console.log(`Current watermark: ${this.watermark}`);
    } else {
      console.log('No watermark set (first run)');
    }
    
    let page = 1;
    let totalCount = 0;
    let watermarkFound = false;
    let firstListingOfSession = null; // Track FIRST listing of entire session
    
    while (page <= numPages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Scraping page ${page}...`);
      console.log(`${'='.repeat(60)}`);
      
      const result = await this.scrapePage(page);
      const { count, hitWatermark } = result;
      
      console.log(`Found ${count} new listings on page ${page}`);
      totalCount += count;
      
      // Capture first listing of the entire session
      if (firstListingOfSession === null && this.listings.length > 0) {
        firstListingOfSession = this.listings[0].cod_ann;
        console.log(`  ⭐ First listing of session: ${firstListingOfSession}`);
      }
      
      if (count === 0) {
        console.log('No more listings found. Stopping.');
        break;
      }
      
      if (hitWatermark) {
        console.log('Watermark reached. Stopping scrape.');
        watermarkFound = true;
        break;
      }
      
      page++;
      await this.sleep(1000); // Wait between pages
    }
    
    // Update watermark with first listing of this scraping session
    if (firstListingOfSession && totalCount > 0) {
      await this.saveWatermark(firstListingOfSession);
      console.log(`\n✓ Watermark updated to: ${firstListingOfSession}`);
    }
    
    console.log(`\nTotal new listings scraped: ${totalCount}`);
    console.log(`Watermark found during scrape: ${watermarkFound ? 'yes' : 'no'}`);
    return totalCount;
  }

  /**
   * Save listings metadata to JSON
   */
  async saveToJSON(filename = 'tunisie_listings.json') {
    const fs = require('fs').promises;
    
    if (this.listings.length === 0) {
      console.log('No listings to save');
      return;
    }

    // Remove HTML from listings
    const jsonListings = this.listings.map(({ html, ...listing }) => listing);
    
    await fs.writeFile(filename, JSON.stringify(jsonListings, null, 2), 'utf-8');
    console.log(`✓ Saved ${this.listings.length} listings to ${filename}`);
  }

  /**
   * Save listings metadata to CSV
   */
  async saveToCSV(filename = 'tunisie_listings.csv') {
    const fs = require('fs').promises;
    
    if (this.listings.length === 0) {
      console.log('No listings to save');
      return;
    }

    // Remove HTML from listings
    const csvListings = this.listings.map(({ html, ...listing }) => listing);
    
    if (csvListings.length === 0) return;
    
    const keys = Object.keys(csvListings[0]);
    const header = keys.map(k => `"${k}"`).join(',');
    
    const rows = csvListings.map(listing => {
      return keys.map(key => {
        const value = listing[key];
        if (value === null || value === undefined) return '""';
        const str = String(value);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csv = [header, ...rows].join('\n');
    
    await fs.writeFile(filename, csv, 'utf-8');
    console.log(`✓ Saved ${this.listings.length} listings to ${filename}`);
  }

  /**
    * Get summary statistics
    */
  async getSummary() {
    const summary = {
      total_listings: this.listings.length,
      mongodb_saved: 0,
      current_watermark: this.watermark,
      by_nature: {},
      by_type: {},
      by_location: {},
      professional_count: 0,
      with_photo_count: 0,
      total_phones: 0,
      total_images: 0
    };

    // Count by nature
    for (const listing of this.listings) {
      const nature = listing.nature || 'Unknown';
      summary.by_nature[nature] = (summary.by_nature[nature] || 0) + 1;
      
      const type = listing.type || 'Unknown';
      summary.by_type[type] = (summary.by_type[type] || 0) + 1;
      
      const location = listing.location || 'Unknown';
      summary.by_location[location] = (summary.by_location[location] || 0) + 1;
      
      if (listing.is_professional) summary.professional_count++;
      if (listing.has_photo) summary.with_photo_count++;
    }

    // Get MongoDB count and extract phone/image stats
    if (this.db) {
      try {
        const listings = await this.db
          .collection('listing_details')
          .find({})
          .toArray();
        
        summary.mongodb_saved = listings.length;
        
        // Count total phones and images
        for (const listing of listings) {
          if (listing.phone_numbers) {
            summary.total_phones += listing.phone_numbers.length;
          }
          if (listing.image_urls) {
            summary.total_images += listing.image_urls.length;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    // Sort locations by count (top 10)
    const sortedLocations = Object.entries(summary.by_location)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    summary.by_location = Object.fromEntries(sortedLocations);

    return summary;
  }

  /**
   * Close MongoDB connection
   */
  async closeMongoDB() {
    if (this.client) {
      await this.client.close();
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const scraper = new EnhancedTunisieAnnonceScraper();

  try {
    // Initialize MongoDB
    await scraper.initMongoDB();

    // Scrape pages
    console.log('Starting enhanced scraper...\n');
    await scraper.scrapeMultiplePages(); // Scrapes until no more listings found

    // Save results
    console.log(`\n${'='.repeat(60)}`);
    console.log('Saving results...');
    console.log(`${'='.repeat(60)}`);
    
    await scraper.saveToJSON('tunisie_listings.json');
    await scraper.saveToCSV('tunisie_listings.csv');

    // Print summary
     const summary = await scraper.getSummary();
     console.log(`\n${'='.repeat(60)}`);
     console.log('=== Summary ===');
     console.log(`${'='.repeat(60)}`);
     console.log(`Total listings scraped: ${summary.total_listings}`);
     console.log(`Saved to MongoDB: ${summary.mongodb_saved}`);
     console.log(`Professional listings: ${summary.professional_count}`);
     console.log(`Listings with photos: ${summary.with_photo_count}`);
     console.log(`Total phone numbers found: ${summary.total_phones}`);
     console.log(`Total images found: ${summary.total_images}`);
     
     console.log('\n=== Watermark Info ===');
     console.log(`Current watermark: ${summary.current_watermark || 'None (first run)'}`);
     
     console.log('\nBy Nature:');
     for (const [nature, count] of Object.entries(summary.by_nature)) {
       console.log(`  ${nature}: ${count}`);
     }
     
     console.log('\nTop 10 Locations:');
     for (const [location, count] of Object.entries(summary.by_location)) {
       console.log(`  ${location}: ${count}`);
     }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.closeMongoDB();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedTunisieAnnonceScraper;
