# Enhanced Scraper Setup Guide

## Requirements
- Python 3.7+
- MongoDB (local or remote)

## Installation

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. MongoDB Setup

#### Option A: Local MongoDB (Windows)
1. Download MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically on `mongodb://localhost:27017/`

#### Option B: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Option C: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string and update in the script:
```python
scraper = EnhancedTunisieAnnonceScraper(
    mongodb_uri="mongodb+srv://username:password@cluster.mongodb.net/"
)
```

## Running the Scraper

### Basic Usage
```bash
python enhanced_scraper.py
```

This will:
1. Scrape 3 pages of listings
2. Follow each listing link and scrape the full HTML
3. Save all data to MongoDB
4. Save metadata to CSV and JSON files

### Customize Pages to Scrape
Edit the script and change:
```python
scraper.scrape_multiple_pages(num_pages=5)  # Change 5 to desired number
```

## Output Files
- `tunisie_listings.json` - Metadata of all listings
- `tunisie_listings.csv` - Metadata in CSV format
- **MongoDB Database** - Full HTML content and metadata
  - Collection: `listing_details`
  - Contains full HTML and all metadata

## MongoDB Queries

### View all listings
```javascript
db.listing_details.find({}).limit(10)
```

### Find listings in a specific location
```javascript
db.listing_details.find({ location: "Hammamet" })
```

### Search by price range
```javascript
db.listing_details.find({ price: { $gte: 100000, $lte: 500000 } })
```

### Get listing count
```javascript
db.listing_details.countDocuments({})
```

## Features
- **Multi-page scraping**: Automatically scrapes page 1, 2, 3, etc.
- **Full HTML storage**: Saves complete HTML of each listing for later processing
- **MongoDB integration**: Persists data with efficient indexing
- **Error handling**: Gracefully handles network errors and continues
- **Rate limiting**: Respects server with delays between requests
- **Summary statistics**: Shows breakdown by nature, type, location
