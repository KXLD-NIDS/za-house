/**
 * Quick debug script to check watermark in MongoDB
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/';
const DB_NAME = 'tunisie_annonces';

async function checkWatermark() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('\n=== Checking Watermark ===\n');
    
    // Check metadata
    const metadata = await db
      .collection('scrape_metadata')
      .findOne({ key: 'last_watermark' });
    
    console.log('Watermark in metadata:');
    if (metadata) {
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      console.log('  (none - first run)');
    }
    
    // Check recent listings
    console.log('\nMost recent 5 listings in database:');
    const listings = await db
      .collection('listing_details')
      .find({})
      .sort({ saved_date: -1 })
      .limit(5)
      .project({ cod_ann: 1, title: 1, saved_date: 1 })
      .toArray();
    
    listings.forEach((l, i) => {
      console.log(`  ${i + 1}. cod_ann: ${l.cod_ann}, title: ${l.title}`);
    });
    
    // Check first listing in latest scrape
    console.log('\nFirst 5 listings in database (oldest):');
    const oldListings = await db
      .collection('listing_details')
      .find({})
      .sort({ saved_date: 1 })
      .limit(5)
      .project({ cod_ann: 1, title: 1, saved_date: 1 })
      .toArray();
    
    oldListings.forEach((l, i) => {
      console.log(`  ${i + 1}. cod_ann: ${l.cod_ann}, title: ${l.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkWatermark().catch(console.error);
