const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// Distribution JSON
// {
//     "title": "Investment A",
//     "period": "Q1 2024",
//     "date": "2024-01-15",
//     "from": "2024-01-01",
//     "to": "2024-03-31",
//     "gross_amount": 1000000,
//     "settled": true
//   },

// Create a new distribution
router.post('/:propertyId', async (req, res) => {
    const propertyId = req.params.propertyId;
    const distribution = req.body;
    distribution.propertyId = propertyId;
    distribution.createdAt = new Date().toISOString();
    distribution.updatedAt = new Date().toISOString();

    try {
        const distributionRef = await db.collection('distributions').add(distribution);
        distribution.id = distributionRef.id;
        res.json(distribution);
    } catch (error) {
        res.status(400).json({ error: 'Error creating distribution' });
    }
});

// Get all distributions for a specific property

router.get('/:propertyId/distributions', async (req, res) => {
    const propertyId = req.params.propertyId;
    const distributions = await db.collection('distributions').where('propertyId', '==', propertyId).get();
    const distributionsList = distributions.docs.map(distribution => distribution.data());
    res.json(distributionsList);
}
);

// Get details of a specific distribution
router.get('/:propertyId/distributions/:distributionId', async (req, res) => {
    const distributionId = req.params.distributionId;
    const distribution = await db.collection('distributions').doc(distributionId).get();
    res.json(distribution.data());
}
);


module.exports = router;