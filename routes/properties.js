const express = require('express');
const router = express();

const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// properties 
router.get('/', async (req, res) => {
    try {
        const properties = [];
        const snapshot = await db.collection('properties').get();
        snapshot.forEach(doc => {
            properties.push(doc.data());
        });
        res.status(200).send(properties);
    } catch (error) {
        res.status(500).send(error);
    }
}
);



module.exports = router;