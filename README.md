# Tunisie Annonce Scraper (Node.js)

Web scraper for tunisie-annonce.com real estate listings. Scrapes listings from multiple pages, follows links to individual listings, saves full HTML and metadata to MongoDB.

## Requirements

- Node.js 14+
- MongoDB (local or remote)

## Installation

### 1. Install Node Dependencies
```bash
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB (Windows)
1. Download MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Run the installer and follow setup wizard
3. MongoDB will start automatically on `mongodb://localhost:27017/`

#### Option B: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option C: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Update MongoDB URI in `scraper.js`:
```javascript
const scraper = new EnhancedTunisieAnnonceScraper(
  'http://www.tunisie-annonce.com/AnnoncesImmobilier.asp',
  'mongodb+srv://username:password@cluster.mongodb.net/',
  'tunisie_annonces'
);
```

## Running the Scraper

### Basic Usage
```bash
npm start
```

or

```bash
node scraper.js
```

This will:
1. Scrape 3 pages of listings
2. Follow each listing link and scrape the full HTML
3. Save all data to MongoDB
4. Save metadata to CSV and JSON files

### Customize Pages
Edit `scraper.js` and change:
```javascript
await scraper.scrapeMultiplePages(5); // Change 5 to desired number
```

## Output Files

- `tunisie_listings.json` - Metadata of all listings in JSON format
- `tunisie_listings.csv` - Metadata in CSV format
- **MongoDB Database** - Full HTML content and metadata
  - Database: `tunisie_annonces`
  - Collection: `listing_details`
  - Contains: full HTML, phone numbers, image URLs, and all metadata

## MongoDB Queries

### Connect to MongoDB
```bash
mongosh  # or mongo
```

### View all listings (first 10)
```javascript
use tunisie_annonces
db.listing_details.find({}).limit(10)
```

### Find listings in a specific location
```javascript
db.listing_details.find({ location: "Hammamet" })
```

### Find listings by nature (Vente, Location, etc)
```javascript
db.listing_details.find({ nature: "Vente" })
```

### Search by price range
```javascript
db.listing_details.find({ price: { $gte: "100000", $lte: "500000" } })
```

### Get listing count
```javascript
db.listing_details.countDocuments({})
```

### View phone numbers for a listing
```javascript
db.listing_details.findOne({ cod_ann: "3435340" }, { phone_numbers: 1, title: 1 })
```

### View image URLs for a listing
```javascript
db.listing_details.findOne({ cod_ann: "3435340" }, { image_urls: 1, title: 1, image_count: 1 })
```

### Find all listings with phone numbers
```javascript
db.listing_details.find({ phone_numbers: { $exists: true, $ne: [] } }).limit(10)
```

### Find all listings with images
```javascript
db.listing_details.find({ image_urls: { $exists: true, $ne: [] } }).limit(10)
```

### View full HTML of a listing
```javascript
db.listing_details.findOne({ cod_ann: "3435340" }, { html: 1, title: 1 })
```

### Get all unique phone numbers
```javascript
db.listing_details.aggregate([
  { $match: { phone_numbers: { $exists: true, $ne: [] } } },
  { $unwind: '$phone_numbers' },
  { $group: { _id: '$phone_numbers', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Features

- ✓ Multi-page scraping (pages 1, 2, 3, etc.)
- ✓ Full HTML storage for each listing
- ✓ **Phone number extraction** (Tunisian format detection)
- ✓ **Full image URL extraction** (with lazy-loading support)
- ✓ MongoDB integration with automatic indexing
- ✓ Error handling and graceful fallback
- ✓ Rate limiting (respects server with delays)
- ✓ Summary statistics by nature, type, location
- ✓ CSV and JSON export
- ✓ Professional listing detection
- ✓ Photo availability detection

## Project Structure

```
scrapper/
├── scraper.js                   # Main scraper class
├── query.js                     # MongoDB query utility
├── package.json                 # NPM dependencies
├── README.md                    # This file
├── SETUP.md                     # Setup instructions
├── tunisie_listings.json        # Output: listing metadata (JSON)
├── tunisie_listings.csv         # Output: listing metadata (CSV)
├── phone_numbers.json           # Output: extracted phone numbers
├── images.json                  # Output: extracted image URLs
└── enhanced_scraper.py          # Python version (legacy)
```

## Troubleshooting

### MongoDB connection error
- Ensure MongoDB is running on localhost:27017
- Check MongoDB URI in script
- If using Atlas, verify connection string and IP whitelist

### Slow scraping
- Natural delays: 0.5s between listings, 1s between pages
- Modify `sleep()` values if needed (be respectful to website)

### No listings found
- Check if website structure has changed
- Verify selectors in `parseListing()` method
- Check network connection

## Query Utility

Quick access to scraped data using `query.js`:

```bash
# Show database statistics
node query.js stats

# Show 5 listings with phone numbers
node query.js phones

# Show 5 listings with images
node query.js images

# Show all unique phone numbers
node query.js phones:all

# Show listings in a location
node query.js location Hammamet

# Show listings by nature
node query.js nature Vente

# Export all phone numbers to JSON
node query.js export:phones

# Export all images to JSON
node query.js export:images
```

## MongoDB Document Structure

Each listing in `listing_details` collection contains:

```javascript
{
  cod_ann: "3435340",
  location: "Sidi Soufiene",
  nature: "Location",
  type: "App. 2 pièc",
  title: "Appartement s plus1",
  link: "Details_Annonces_Immobilier.asp?cod_ann=3435340&titre=...",
  price: "450",
  date_modified: "13/11/2025",
  has_photo: true,
  is_professional: false,
  scrape_date: "2025-11-13T21:02:04.000Z",
  
  // Newly extracted fields
  phone_numbers: ["216XXXXXXXX", "0XXXXXXXXX"],
  phone_count: 2,
  image_urls: ["http://...", "http://..."],
  image_count: 3,
  
  // Full HTML for further processing
  html: "<!DOCTYPE html>...",
  saved_date: ISODate("2025-11-13T21:02:05.000Z")
}
```

## Performance Notes

- Scraping 3 pages (90 listings) takes ~5-10 minutes
- Full HTML is stored in MongoDB for later processing
- Each listing makes 2 HTTP requests (list page + detail page)
- Phone and image extraction is done in-memory (very fast)

## Extracted Data Formats

**Phone Numbers:** 
- Supports +216XXXXXXXX (international)
- Supports 0XXXXXXXXX (local)
- Supports 216XXXXXXXX (alternative)
- Removes duplicates automatically

**Image URLs:**
- Absolute URLs (no relative paths)
- Supports lazy-loading (data-src, data-image attributes)
- Supports picture/srcset elements
- Removes duplicates automatically

## License

MIT
