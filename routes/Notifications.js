const express = require('express');
const router = express();

const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// getmessages

const { getMessaging } =
    require('firebase-admin/messaging');

// Get all notifications

router.get('/', async (req, res) => {
    try {
        const notifications = [];
        const snapshot = await db.collection('notifications').get();
        snapshot.forEach(doc => {
            notifications.push(doc.data());
        });
        res.status(200).send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Get a notification by ID

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const notification = await db.collection('notifications').doc(id).get();
        if (!notification.exists) {
            res.status(404).send('Notification not found');
        } else {
            res.status(200).send(notification.data());
        }
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Create a new notification

router.post('/', async (req, res) => {
    try {
        const id = req.body.userID;
        // find RegistrationToken from users collection using userID
        const user = await db.collection('users').doc(id).get();
        if (!user.exists) {
            res.status(404).send('User not found');
            return;
        }
        const registrationToken = user.data().FCMToken;

        const message = {
            notification: {
                title: req.body.title || 'New Notification',
                body: req.body.body || 'You have a new notification'
            },
            token: registrationToken
        };

        const sendNotificationPromise = getMessaging().send(message);
        const saveDataPromise = db.collection('notifications').add({
            title: req.body.title || 'You have a new notification',

            body: req.body.body || 'You have a new notification',

            userID: req.body.userID,
            PropertyID: req.body.PropertyID || null,

            time: new Date(),
            status: 'unread',
            type: req.body.type || 'general',
            Delivered_Status: true // assuming Delivered_Status is a boolean
        });

        // Wait for both promises to resolve
        await Promise.all([sendNotificationPromise, saveDataPromise]);

        res.status(201).send('Notification created');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred');
    }
});

// get all notifications for a specific user

router.get('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const notifications = [];
        const snapshot = await db.collection('notifications').where('userID', '==', id).get();
        snapshot.forEach(doc => {
            notifications.push(doc.data());
        });
        res.status(200).send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
}
);


// Update a notification

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        await db.collection('notifications').doc(id).update(data);
        res.status(200).send('Notification updated');
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Delete a notification

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db.collection('notifications').doc(id).delete();
        res.status(200).send('Notification deleted');
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// add a notification to users collection
router.post('users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const userRef = await db.collection('users').doc(id).collection('notifications').add(data);
        data.id = userRef.id;
        res.status(201).send(data);
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Get all notifications for a specific user

router.get('users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const notifications = [];
        const snapshot = await db.collection('users').doc(id).collection('notifications').get();
        snapshot.forEach(doc => {
            notifications.push(doc.data());
        });
        res.status(200).send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
}
);

module.exports = router;