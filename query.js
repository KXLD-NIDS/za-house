/**
 * MongoDB Query Utility
 * Quick queries for the tunisie_annonces database
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/';
const DB_NAME = 'tunisie_annonces';
const COLLECTION = 'listing_details';

class QueryUtil {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      console.log(`✓ Connected to ${DB_NAME}`);
      return true;
    } catch (error) {
      console.error(`✗ Connection failed: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  /**
   * Get all listings with phone numbers
   */
  async getListingsWithPhones(limit = 10) {
    const listings = await this.db
      .collection(COLLECTION)
      .find({ phone_numbers: { $exists: true, $ne: [] } })
      .limit(limit)
      .project({ title: 1, phone_numbers: 1, location: 1, price: 1 })
      .toArray();
    
    return listings;
  }

  /**
   * Get all listings with images
   */
  async getListingsWithImages(limit = 10) {
    const listings = await this.db
      .collection(COLLECTION)
      .find({ image_urls: { $exists: true, $ne: [] } })
      .limit(limit)
      .project({ title: 1, image_urls: 1, image_count: 1, location: 1 })
      .toArray();
    
    return listings;
  }

  /**
   * Get a specific listing by cod_ann
   */
  async getListingByCodAnn(codAnn) {
    const listing = await this.db
      .collection(COLLECTION)
      .findOne({ cod_ann: codAnn });
    
    return listing;
  }

  /**
   * Get all phone numbers from all listings
   */
  async getAllPhoneNumbers() {
    const result = await this.db
      .collection(COLLECTION)
      .aggregate([
        { $match: { phone_numbers: { $exists: true, $ne: [] } } },
        { $unwind: '$phone_numbers' },
        { $group: { _id: '$phone_numbers', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();
    
    return result;
  }

  /**
   * Get listings by location
   */
  async getListingsByLocation(location, limit = 10) {
    const listings = await this.db
      .collection(COLLECTION)
      .find({ location })
      .limit(limit)
      .project({ title: 1, phone_numbers: 1, image_count: 1, price: 1 })
      .toArray();
    
    return listings;
  }

  /**
   * Get listings by nature (Vente, Location, etc)
   */
  async getListingsByNature(nature, limit = 10) {
    const listings = await this.db
      .collection(COLLECTION)
      .find({ nature })
      .limit(limit)
      .project({ title: 1, location: 1, phone_numbers: 1, image_count: 1, price: 1 })
      .toArray();
    
    return listings;
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const total = await this.db.collection(COLLECTION).countDocuments({});
    
    const withPhones = await this.db
      .collection(COLLECTION)
      .countDocuments({ phone_numbers: { $exists: true, $ne: [] } });
    
    const withImages = await this.db
      .collection(COLLECTION)
      .countDocuments({ image_urls: { $exists: true, $ne: [] } });
    
    const phoneStats = await this.db
      .collection(COLLECTION)
      .aggregate([
        { $match: { phone_numbers: { $exists: true } } },
        { $group: { _id: null, total_phones: { $sum: { $size: '$phone_numbers' } } } }
      ])
      .toArray();
    
    const imageStats = await this.db
      .collection(COLLECTION)
      .aggregate([
        { $match: { image_urls: { $exists: true } } },
        { $group: { _id: null, total_images: { $sum: { $size: '$image_urls' } } } }
      ])
      .toArray();
    
    return {
      total_listings: total,
      with_phones: withPhones,
      with_images: withImages,
      total_phone_numbers: phoneStats[0]?.total_phones || 0,
      total_images: imageStats[0]?.total_images || 0
    };
  }

  /**
   * Export phone numbers to JSON
   */
  async exportPhoneNumbers(filename = 'phone_numbers.json') {
    const fs = require('fs').promises;
    
    const listings = await this.db
      .collection(COLLECTION)
      .find({ phone_numbers: { $exists: true, $ne: [] } })
      .project({ title: 1, location: 1, phone_numbers: 1, cod_ann: 1 })
      .toArray();
    
    const data = {
      exported_at: new Date().toISOString(),
      total_listings: listings.length,
      listings
    };
    
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`✓ Exported ${listings.length} phone numbers to ${filename}`);
  }

  /**
   * Export images to JSON
   */
  async exportImages(filename = 'images.json') {
    const fs = require('fs').promises;
    
    const listings = await this.db
      .collection(COLLECTION)
      .find({ image_urls: { $exists: true, $ne: [] } })
      .project({ title: 1, location: 1, image_urls: 1, cod_ann: 1 })
      .toArray();
    
    const data = {
      exported_at: new Date().toISOString(),
      total_listings: listings.length,
      total_images: listings.reduce((sum, l) => sum + (l.image_urls?.length || 0), 0),
      listings
    };
    
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`✓ Exported images to ${filename}`);
  }
}

/**
 * Main CLI
 */
async function main() {
  const util = new QueryUtil();
  
  if (!(await util.connect())) {
    process.exit(1);
  }

  const command = process.argv[2];

  try {
    switch (command) {
      case 'stats':
        console.log('\n=== Database Statistics ===');
        const stats = await util.getStatistics();
        console.log(`Total listings: ${stats.total_listings}`);
        console.log(`Listings with phone numbers: ${stats.with_phones}`);
        console.log(`Listings with images: ${stats.with_images}`);
        console.log(`Total phone numbers: ${stats.total_phone_numbers}`);
        console.log(`Total images: ${stats.total_images}`);
        break;

      case 'phones':
        console.log('\n=== Listings with Phone Numbers ===');
        const withPhones = await util.getListingsWithPhones(5);
        withPhones.forEach(listing => {
          console.log(`\n${listing.title}`);
          console.log(`  Location: ${listing.location}`);
          console.log(`  Phones: ${listing.phone_numbers?.join(', ')}`);
        });
        break;

      case 'images':
        console.log('\n=== Listings with Images ===');
        const withImages = await util.getListingsWithImages(5);
        withImages.forEach(listing => {
          console.log(`\n${listing.title}`);
          console.log(`  Location: ${listing.location}`);
          console.log(`  Image count: ${listing.image_count}`);
          console.log(`  Images: ${listing.image_urls?.slice(0, 2).join(', ')}${listing.image_urls?.length > 2 ? '...' : ''}`);
        });
        break;

      case 'phones:all':
        console.log('\n=== All Phone Numbers ===');
        const allPhones = await util.getAllPhoneNumbers();
        allPhones.slice(0, 20).forEach(item => {
          console.log(`  ${item._id}: ${item.count} listing(s)`);
        });
        break;

      case 'location':
        const location = process.argv[3];
        if (!location) {
          console.error('Usage: node query.js location <location_name>');
          break;
        }
        console.log(`\n=== Listings in ${location} ===`);
        const byLocation = await util.getListingsByLocation(location);
        byLocation.forEach(listing => {
          console.log(`  ${listing.title}`);
          console.log(`    Phones: ${listing.phone_numbers?.length || 0}, Images: ${listing.image_count || 0}`);
        });
        break;

      case 'nature':
        const nature = process.argv[3];
        if (!nature) {
          console.error('Usage: node query.js nature <nature_type>');
          break;
        }
        console.log(`\n=== ${nature} Listings ===`);
        const byNature = await util.getListingsByNature(nature);
        byNature.forEach(listing => {
          console.log(`  ${listing.title} (${listing.location})`);
          console.log(`    Phones: ${listing.phone_numbers?.length || 0}, Images: ${listing.image_count || 0}`);
        });
        break;

      case 'export:phones':
        await util.exportPhoneNumbers('phone_numbers.json');
        break;

      case 'export:images':
        await util.exportImages('images.json');
        break;

      default:
        console.log(`
Usage: node query.js <command>

Commands:
  stats                 - Show database statistics
  phones                - Show 5 listings with phone numbers
  images                - Show 5 listings with images
  phones:all            - Show all phone numbers found
  location <name>       - Show listings in a location
  nature <type>         - Show listings by nature (Vente, Location, etc)
  export:phones         - Export all phone numbers to JSON
  export:images         - Export all images to JSON

Examples:
  node query.js stats
  node query.js location Hammamet
  node query.js nature Vente
  node query.js export:phones
        `);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    await util.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = QueryUtil;
