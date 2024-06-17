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
        const registrationToken = 'cmSzxjojQ-KfYcrQlxy7-x:APA91bFuypEJpdkB4jgIh--EQ_J8o6GhIHuKQJAVhotTSqIEfk-Xw4gOCNpy6dNvA7Mwbzo5C9BdklG4s-ahki8copn_VUtM1jqTMy49f6eDC9FXjrU_z95Er2KwSmMWGZow0Qd0yHf9';
        const message = {
            notification: {
                title: 'New Deal Shared!',
                body: 'Check out the new deal shared by the admin!'
            },
            token: registrationToken
        };

        const sendNotificationPromise = getMessaging().send(message);
        const saveDataPromise = db.collection('notifications').add({
            title: 'New Deal Shared!',
            body: 'Check out the new deal shared by the admin!',
            PropertyID: req.body.PropertyID,
            time: new Date(),
            status: 'unread',
            type: 'deal',
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