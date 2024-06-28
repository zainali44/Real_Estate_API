const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Get all messages from a specific chat
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('chats')
            .doc('rDtiiDrvZqWU2DGYknY0bG2Ln2h1_saq4Q4x8XeYfwNA8TpVToqaq4Zz2')
            .collection('messages')
            .get();

        const messages = await Promise.all(snapshot.docs.map(async doc => {
            const messageData = doc.data();
            // Fetch sender name
            const senderSnapshot = await db.collection('users').doc(messageData.fromId).get();
            const senderName = senderSnapshot.exists ? senderSnapshot.data().name : 'Unknown';
            // Fetch receiver name
            const receiverSnapshot = await db.collection('users').doc(messageData.toId).get();
            const receiverName = receiverSnapshot.exists ? receiverSnapshot.data().name : 'Unknown';

            // Add sender and receiver names to message data
            return {
                ...messageData,
                senderName,
                receiverName
            };
        }));

        res.status(200).send(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Error fetching messages');
    }
});

// Get messages by specific user (fromId)
router.get('/:id', async (req, res) => {
    try {
        const snapshot = await db.collection('chats')
            .doc('rDtiiDrvZqWU2DGYknY0bG2Ln2h1_saq4Q4x8XeYfwNA8TpVToqaq4Zz2')
            .collection('messages')
            .where('fromId', '==', req.params.id)
            .get();

        const messages = await Promise.all(snapshot.docs.map(async doc => {
            const messageData = doc.data();

            // Fetch receiver name
            const receiverSnapshot = await db.collection('users').doc(messageData.toId).get();
            const receiverName = receiverSnapshot.exists ? receiverSnapshot.data().name : 'Unknown';

            // Add receiver name to message data
            return {
                ...messageData,
                receiverName
            };
        }));

        res.status(200).send(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Error fetching messages');
    }
});

module.exports = router;
