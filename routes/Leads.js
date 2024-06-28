const express = require('express');
const router = express();

const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// {
//     "lead_id": "string",                  // Unique identifier for the lead
//     "property_id": "string",              // Unique identifier for the property
//     "buyer_info": {
//       "first_name": "string",
//       "last_name": "string",
//       "email": "string",
//       "phone": "string"
//     },
//     "offer_details": {
//       "offer_price": "number",            // The price being offered
//       "offer_date": "string",             // The date the offer is made (ISO 8601 format)
//       "financing_type": "string",         // E.g., "cash", "mortgage"
//       "down_payment": "number",           // Down payment amount
//       "contingencies": "string",          // Any contingencies (e.g., inspection, appraisal)
//       "closing_date": "string"            // Desired closing date (ISO 8601 format)
//     },
//     "agent_info": {
//       "agent_id": "string",               // Unique identifier for the agent
//       "agent_name": "string",
//       "agent_email": "string",
//       "agent_phone": "string"
//     },
//     "comments": "string"                  // Additional comments or notes
//   }
  

// New lead
router.post('/', async (req, res) => {
    try {
        const lead = {
            lead_id: req.body.lead_id,
            property_id: req.body.property_id,
            buyer_info: req.body.buyer_info,
            offer_details: req.body.offer_details,
            agent_info: req.body.agent_info,
            comments: req.body.comments
        };
        const newLead = await db.collection('leads').add(lead);
        res.status(201).send(newLead);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all leads
router.get('/', async (req, res) => {
    try {
        const leads = [];
        const snapshot = await db.collection('leads').get();
        snapshot.forEach(doc => {
            leads.push(doc.data());
        });
        res.status(200).send(leads);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a lead by ID
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const lead = await db.collection('leads').doc(id).get();
        if (!lead.exists) {
            res.status(404).send('Lead not found');
        } else {
            res.status(200).send(lead.data());
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update a lead
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        await db.collection('leads').doc(id).update(data);
        res.status(200).send('Lead updated');
    } catch (error) {
        res.status(500).send(error);
    }
});

// Delete a lead
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db.collection('leads').doc(id).delete();
        res.status(200).send('Lead deleted');
    } catch (error) {
        res.status(500).send(error);
    }
});

// add a comment to a lead
router.post('/:id/comment', async (req, res) => {
    try {
        const id = req.params.id;
        const leadRef = db.collection('leads').doc(id);
        const newComment = {
            comment: req.body.comment,
            commentedBy: req.body.commentedBy,
            commentDate: req.body.commentDate || new Date()
        };

        // Add the new comment to LeadComments array
        await leadRef.update({
            LeadComments: admin.firestore.FieldValue.arrayUnion(newComment)
        });

        res.status(200).send('Comment added');
    } catch (error) {
        res.status(500).send(error);
    }
});



module.exports = router;