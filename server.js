const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 5000;

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const dbName = 'tunisie_annonces';
let db = null;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MongoDB
async function initMongoDB() {
  try {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    
    db = client.db(dbName);
    console.log(`✓ Connected to MongoDB: ${dbName}`);
    return true;
  } catch (error) {
    console.error(`✗ MongoDB connection failed: ${error.message}`);
    console.log('Make sure MongoDB is running on localhost:27017');
    return false;
  }
}

// Routes

// Get all listings with filters
app.get('/api/listings', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { nature, location, minPrice, maxPrice, limit = 1000, skip = 0 } = req.query;

    // Build filter query
    const filter = {};

    if (nature) {
      const natures = Array.isArray(nature) ? nature : [nature];
      filter.nature = { $in: natures };
    }

    if (location) {
      const locations = Array.isArray(location) ? location : [location];
      filter.location = { $in: locations };
    }

    if (minPrice || maxPrice) {
      filter.$expr = {
        $and: [
          ...(minPrice ? [{
            $gte: [
              {
                $convert: {
                  input: { $replaceAll: { input: '$price', find: ' ', replacement: '' } },
                  to: 'int',
                  onError: 0,
                  onNull: 0
                }
              },
              parseInt(minPrice)
            ]
          }] : []),
          ...(maxPrice ? [{
            $lte: [
              {
                $convert: {
                  input: { $replaceAll: { input: '$price', find: ' ', replacement: '' } },
                  to: 'int',
                  onError: 0,
                  onNull: 0
                }
              },
              parseInt(maxPrice)
            ]
          }] : [])
        ]
      };
    }

    // Execute query
    const listings = await db
      .collection('listing_details')
      .find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();

    // Get total count for pagination
    const total = await db
      .collection('listing_details')
      .countDocuments(filter);

    res.json({
      success: true,
      data: listings,
      total,
      count: listings.length
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single listing by cod_ann
app.get('/api/listings/:codAnn', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const listing = await db
      .collection('listing_details')
      .findOne({ cod_ann: req.params.codAnn });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get filter options (unique natures and locations)
app.get('/api/filters', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected',
        data: {
          natures: [],
          locations: [],
          priceRange: { min: 0, max: 1500000 }
        }
      });
    }

    const natures = await db
      .collection('listing_details')
      .distinct('nature');

    const locations = await db
      .collection('listing_details')
      .distinct('location');

    const stats = await db
      .collection('listing_details')
      .aggregate([
        {
          $addFields: {
            numPrice: {
              $convert: {
                input: { $replaceAll: { input: '$price', find: ' ', replacement: '' } },
                to: 'int',
                onError: 0,
                onNull: 0
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            minPrice: {
              $min: '$numPrice'
            },
            maxPrice: {
              $max: '$numPrice'
            }
          }
        }
      ])
      .toArray();

    const priceStats = stats[0] || { minPrice: 0, maxPrice: 1500000 };

    res.json({
      success: true,
      data: {
        natures: natures.sort(),
        locations: locations.sort(),
        priceRange: {
          min: priceStats.minPrice,
          max: priceStats.maxPrice
        }
      }
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: {
        natures: [],
        locations: [],
        priceRange: { min: 0, max: 1500000 }
      }
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const total = await db.collection('listing_details').countDocuments();

    const byNature = await db
      .collection('listing_details')
      .aggregate([
        { $group: { _id: '$nature', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();

    const byLocation = await db
      .collection('listing_details')
      .aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();

    res.json({
      success: true,
      data: {
        totalListings: total,
        byNature,
        topLocations: byLocation
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: db ? 'connected' : 'disconnected' });
});

// Start server
async function startServer() {
  const connected = await initMongoDB();
  
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`${'='.repeat(50)}`);
    if (connected) {
      console.log('✓ MongoDB connected');
      console.log('✓ API ready for requests');
    } else {
      console.log('⚠ MongoDB not available');
      console.log('Please start MongoDB and restart the server');
    }
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/listings - Get all listings with filters`);
    console.log(`  GET /api/listings/:codAnn - Get specific listing`);
    console.log(`  GET /api/filters - Get filter options`);
    console.log(`  GET /api/stats - Get statistics`);
    console.log(`  GET /api/health - Health check`);
    console.log(`${'='.repeat(50)}\n`);
  });
}

startServer();
