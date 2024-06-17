const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// Middleware to authenticate user and get user ID
// cons = async (req, res, next) => {
//     const idToken = req.headers.authorization;
//     try {
//         const decodedToken = await admin.auth().verifyIdToken(idToken);
//         req.user = { uid: decodedToken.uid, email: decodedToken.email };
//         next();
//     } catch (error) {
//         res.status(401).send('Unauthorized');
//     }
// };

// Get all auctions for a specific property
router.get('/properties/:propertyId/auctions', async (req, res) => {
    const propertyId = req.params.propertyId;
    const auctions = await db.collection('auctions').where('propertyId', '==', propertyId).get();
    const auctionsList = auctions.docs.map(auction => auction.data());
    res.json(auctionsList);
});

// Get details of a specific auction
router.get('/properties/:propertyId/auctions/:auctionId', async (req, res) => {
    const auctionId = req.params.auctionId;
    const auction = await db.collection('auctions').doc(auctionId).get();
    res.json(auction.data());
});

// Create a new auction
router.post('/properties/:propertyId/auctions', async (req, res) => {
    const propertyId = req.params.propertyId;
    const auction = req.body;
    auction.propertyId = propertyId;
    auction.createdAt = new Date().toISOString();
    auction.updatedAt = new Date().toISOString();
    auction.status = 'open';
    auction.currentBid = 0;
    // auction.createdBy = req.user.uid;

  try {
    const auctionRef = await db.collection('auctions').add(auction);
    auction.id = auctionRef.id;
    res.json(auction);
  } catch (error) {
    res.status(400).json({ error: 'Error creating auction' });
  }

});

// Update an auction
router.put('/properties/:propertyId/auctions/:auctionId', async (req, res) => {
    const auctionId = req.params.auctionId;
    const auction = req.body;
    auction.updatedAt = new Date().toISOString();
    await db.collection('auctions').doc(auctionId).update(auction);
    res.json(auction);
});

// Delete an auction
router.delete('/properties/:propertyId/auctions/:auctionId', async (req, res) => {
    const auctionId = req.params.auctionId;
    await db.collection('auctions').doc(auctionId).delete();
    res.json({ id: auctionId });
});

// Place a bid on an auction
router.post('/properties/:propertyId/auctions/bids', async (req, res) => {
    const propertyId = req.params.propertyId;
    const bid = req.body;
    const auctions = await db.collection('auctions').where('propertyId', '==', propertyId).where('status', '==', 'open').get();

    if (auctions.docs.length === 0) {
        return res.status(404).json({ error: 'Auction not found' });
    }   
    else if (auctions.docs[0].data().status !== 'open') {
        return res.status(400).json({ error: 'Auction is not open for bidding' });
    }

    const auctionId = auctions.docs[0].id;
    const auction = auctions.docs[0].data();

    if (bid.bidAmount <= auction.currentBid) {
        return res.status(400).json({ error: 'Bid amount should be greater than current bid' });
    }

    bid.auctionId = auctionId;
    bid.bidderId = 'rDtiiDrvZqWU2DGYknY0bG2Ln2h1';
    bid.createdAt = new Date().toISOString();
    try {
        const bidRef = await db.collection('bids').add(bid);
        bid.id = bidRef.id;
        await db.collection('auctions').doc(auctionId).update({ currentBid: bid.bidAmount });
        res.json(bid);
    }
    catch (error) {
        res.status(400).json({ error: 'Error placing bid' });
    }
});

// Get all bids for a specific auction
router.get('/properties/:propertyId/bids', async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const auctions = await db.collection('auctions')
            .where('propertyId', '==', propertyId)
            .where('status', '==', 'open')
            .get();
        
        
        if (auctions.docs.length === 0) {
            return res.status(404).json({ error: 'Auction not found' });
        }
        
        const auctionId = auctions.docs[0].id;
        const bids = await db.collection('bids')
            .where('auctionId', '==', auctionId)
            .get();
        
        
        const bidsList = bids.docs.map(bid => bid.data());
        res.json(bidsList);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching bids' });
    }
});


// Accept an auction
router.patch('/auctions/:auctionId/accept', async (req, res) => {
    const auctionId = req.params.auctionId;
    await db.collection('auctions').doc(auctionId).update({ status: 'accepted', acceptedBy: req.user.uid, updatedAt: new Date().toISOString() });
    res.json({ id: auctionId, status: 'accepted' });
});

// End an auction and declare the winner
router.patch('/auctions/:auctionId/end', async (req, res) => {
    const auctionId = req.params.auctionId;
    const auctionRef = db.collection('auctions').doc(auctionId);
    const auction = await auctionRef.get();

    if (!auction.exists) {
        return res.status(404).json({ error: 'Auction not found' });
    }

    const bids = await db.collection('bids').where('auctionId', '==', auctionId).orderBy('bidAmount', 'desc').limit(1).get();
    const winnerBid = bids.docs.length ? bids.docs[0].data() : null;

    await auctionRef.update({ status: 'closed', winnerBidId: winnerBid ? winnerBid.id : null, updatedAt: new Date().toISOString() });

    res.json({ id: auctionId, status: 'closed', winnerBid });
});

module.exports = router;
