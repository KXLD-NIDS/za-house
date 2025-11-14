# Watermark System Documentation

## Overview

The scraper now implements a watermark-based system to efficiently scrape only new listings. This prevents duplicate processing and tracks progress across multiple scrape runs.

## How It Works

### First Run (No Watermark)
1. Scraper runs and scrapes the latest **5 pages** of listings
2. The first listing encountered is saved as the **watermark**
3. All listings are processed and saved to MongoDB

### Subsequent Runs
1. Scraper loads the previous watermark from MongoDB
2. Scrapes the latest 5 pages again
3. **Stops immediately** when it encounters the watermark (the first listing from the previous run)
4. Only new listings (before the watermark) are processed
5. Updates the watermark to the first listing of the current scrape

## Data Structure

### New MongoDB Collection: `scrape_metadata`
Stores scraper state information:
```json
{
  "key": "last_watermark",
  "cod_ann": "12345678",
  "updated_at": "2024-11-14T10:30:00.000Z"
}
```

### Updated Listing Fields
Each listing now tracks:
- `cod_ann`: Unique listing ID (used for watermark)
- `scrape_date`: ISO timestamp of when it was scraped
- `saved_date`: ISO timestamp when saved to MongoDB

## Usage

### Run the scraper
```bash
node scraper.js
```

The scraper will:
- Load the existing watermark (if any)
- Scrape up to 5 pages (fewer if watermark is reached)
- Save new listings to MongoDB
- Update the watermark to the first listing scraped

### Output Example
```
Starting scrape of latest 5 pages...
Current watermark: 87654321

============================================================
Scraping page 1...
============================================================
Found 15 new listings on page 1
  → Fetching details: Beautiful Villa in Hammamet
    ✓ Saved to MongoDB (2 phones, 5 images)
  [...]

============================================================
Scraping page 2...
============================================================
⚠ Reached watermark: 87654321. Stopping scrape.

Total new listings scraped: 18

=== Watermark Info ===
Previous watermark: 87654321
New watermark: 12345678
```

## Benefits

1. **Efficiency**: Only processes new listings, not duplicates
2. **Incremental**: Can run scraper frequently without redundancy
3. **Tracking**: Automatically tracks scrape progress in MongoDB
4. **Flexible**: Still processes up to 5 pages if no new listings reach the watermark

## Notes

- The watermark is automatically managed - no manual intervention needed
- First run will have no watermark (all 5 pages processed)
- If 5 pages are exhausted without hitting the watermark, all listings are processed normally
- MongoDB must be available for watermark functionality
