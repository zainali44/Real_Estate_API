const express = require('express');
const router = express();

const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = [];
        const snapshot = await db.collection('users').get();
        snapshot.forEach(doc => {
            users.push(doc.data());
        });
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

//   "role": "investor", Get all investors
router.get('/investors', async (req, res) => {
    try {
        const investors = [];
        const snapshot = await db.collection('users').where('role', '==', 'investor').get();
        snapshot.forEach(doc => {
            investors.push(doc.data());
        });
        res.status(200).send(investors);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get Specific investor
router.get('/investors/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const investor = await db.collection('users').doc(id).get();
        res.status(200).send(investor.data());
    } catch (error) {
        res.status(500).send(error);
    }
});

//   "role": "prospect", Get all prospects
router.get('/prospects', async (req, res) => {
    try {
        const prospects = [];
        const snapshot = await db.collection('users').where('role', '==', 'prospect').get();
        snapshot.forEach(doc => {
            prospects.push(doc.data());
        });
        res.status(200).send(prospects);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get Specific prospect
router.get('/prospects/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const prospect = await db.collection('users').doc(id).get();
        res.status(200).send(prospect.data());
    } catch (error) {
        res.status(500).send(error);
    }
});

// [
//     {
//         "investors": [
//             {
//                 "uid": "KSXyCjbHzBfKNgdoq7fodIVF3kP2",
//                 "investment_details": {
//                     "commitment_date": "2024-06-23",
//                     "committed_amount": 50000,
//                     "contributed_amount": 30000,
//                     "distribution_amount": "500",
//                     "investment_class": "LP Class"
//                 }
//             }
//         ]
//     }
// ]
// create a new investor to sub collection of properties
router.post('/investors/:PropertyId', async (req, res) => {
    try {
        const PropertyId = req.params.PropertyId;
        const data = req.body;
        const investor = await db.collection('properties').doc(PropertyId).collection('investors').add(data);
        res.status(200).send(investor);
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Fetch all investors of a property and users based on uid
router.get('/invest/:PropertyId', async (req, res) => {
    try {
        const PropertyId = req.params.PropertyId;
        const investorsSnapshot = await db.collection('properties').doc(PropertyId).collection('investors').get();

        const investors = [];
        const userPromises = [];

        investorsSnapshot.forEach(doc => {
            const investorData = doc.data();
            investors.push({ id: doc.id, ...investorData });

            // console.log('investorData:', investorData.investors[0].uid);

            // Fetch user's information based on uid from users collection
            const userPromise = db.collection('users').doc(investorData.investors[0].uid).get();
            userPromises.push(userPromise);
        });

        const userSnapshots = await Promise.all(userPromises);

        const investorsWithUserDetails = investors.map((investor, index) => {
            const userSnapshot = userSnapshots[index];
            const userData = userSnapshot.exists ? userSnapshot.data() : null;
            return { ...investor, userDetails: userData };
        });

        res.status(200).send(investorsWithUserDetails);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching investors and user details', details: error.message });
    }
});

// Fetech the property with of a specific investor
router.get('/invest/:InvestorId/property', async (req, res) => {
    const investorId = req.params.InvestorId;

    try {
        const propertiesSnapshot = await db.collection('properties').get();
        const properties = [];

        for (const propertyDoc of propertiesSnapshot.docs) {
            const investorsSnapshot = await propertyDoc.ref.collection('investors').get();
            let investorFound = false;

            for (const investorDoc of investorsSnapshot.docs) {
                const investorData = investorDoc.data();

                // Check if the current investor's uid matches the investorId from the request
                // console.log('investorData.uid:', investorData.investors);
                // console.log('investorId:', investorId);
                if (investorData.investors[0].uid === investorId) {
                    investorFound = true;
                    break;
                }
            }

            if (investorFound) {
                properties.push({ id: propertyDoc.id, ...propertyDoc.data() });
            }
        }

        res.status(200).json(properties);
    } catch (error) {
        console.error('Error retrieving properties:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.get('/investors/:InvestorId/requests', async (req, res) => {
    const InvestorId = req.params.InvestorId;
    // console.log('InvestorId:', InvestorId);
    try {
        const requests = [];
        const requestsSnapshot = await db.collectionGroup('requests').get();
        
        const userPromises = [];

        requestsSnapshot.forEach(doc => {
            const requestData = doc.data();
            // console.log('requestData:', InvestorId);
            if (requestData.investor_uid === InvestorId) {
                requests.push({ id: doc.id, ...requestData });
            }
        });

        res.status(200).send(requests);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching requests and user details', details: error.message });
    }
});


// {
//     "date": "2024-06-25T10:15:00Z",
//     "details": {
//       "question": "What is status of the renovation?",
//       "response": "Renovation is 50% complete. Expected to finish by end of July.",
//       "status": "Answered"
//     },
//     "id": "mDIrGtzzC2i4xiarCOdD",
//     "investor_uid": "KSXyCjbHzBfKNgdoq7fodIVF3kP2",
//     "property_id": "KSXyCjbHzBfKNgdoq7fodIVF3kP2",
//     "requested_category": "Insurance",
//     "comments": [
//       {
//         "text": "Initial question about renovation status.",
//         "response": "Renovation is 50% complete."
//       },
//       {
//         "text": "Follow-up question about insurance coverage.",
//         "response": "Insurance coverage is in place."
//       }
//     ]
//   }
// Fetch all requests of a property and users based on investor_uid
router.get('/requests/:PropertyId/users', async (req, res) => {
    try {
        const PropertyId = req.params.PropertyId;
        const requestsSnapshot = await db.collection('properties').doc(PropertyId).collection('requests').get();

        const requests = [];
        const userPromises = [];

        requestsSnapshot.forEach(doc => {
            const requestData = doc.data();
            requests.push({ id: doc.id, ...requestData });

            // Fetch user's information based on investor_uid from users collection
            const userPromise = db.collection('users').doc(requestData.investor_uid).get();
            userPromises.push(userPromise);
        });

        const userSnapshots = await Promise.all(userPromises);

        const requestsWithUserDetails = requests.map((request, index) => {
            const userSnapshot = userSnapshots[index];
            const userData = userSnapshot.exists ? userSnapshot.data() : null;
            return { ...request, userDetails: userData };
        });

        res.status(200).send(requestsWithUserDetails);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching requests and user details', details: error.message });
    }
});

// add a new request to a property
router.post('/requests/:PropertyId', async (req, res) => {
    try {
        const PropertyId = req.params.PropertyId;
        const data = req.body;
        const request = await db.collection('properties').doc(PropertyId).collection('requests').add(data);
        const requestId = request.id;
        await db.collection('properties').doc(PropertyId).collection('requests').doc(requestId).update({ id: requestId });
        

        res.status(200).send(request);
    } catch (error) {
        res
            .status(500)
            .send({ error: 'Error creating request', details: error.message });
    }
});

// Get All Requests of all properties
router.get('/AllRequests/users', async (req, res) => {
    try {
        const requests = [];
        const requestsSnapshot = await db.collectionGroup('requests').get();

        const userPromises = [];

        requestsSnapshot.forEach(doc => {
            const requestData = doc.data();
            requests.push({ id: doc.id, ...requestData });

            // console.log('requestData:', requestData);

            // Fetch user's information based on investor_uid from users collection
            const userPromise = db.collection('users').doc(requestData.investor_uid).get();
            userPromises.push(userPromise);
        });

        const userSnapshots = await Promise.all(userPromises);

        const requestsWithUserDetails = requests.map((request, index) => {
            const userSnapshot = userSnapshots[index];
            const userData = userSnapshot.exists ? userSnapshot.data() : null;
            return { ...request, userDetails: userData };
        });

        res.status(200).send(requestsWithUserDetails);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching requests and user details', details: error.message });
    }
});

// // comments array in requests
// {
//     "date": "2024-06-25T10:15:00Z",
//     "details": {
//       "question": "What is status of the renovation?",
//       "response": "Renovation is 50% complete. Expected to finish by end of July.",
//       "status": "Answered"
//     },
//     "id": "mDIrGtzzC2i4xiarCOdD",
//     "investor_uid": "KSXyCjbHzBfKNgdoq7fodIVF3kP2",
//     "property_id": "KSXyCjbHzBfKNgdoq7fodIVF3kP2",
//     "requested_category": "Insurance",
//     "comments": [
//       {
//         "text": "Initial question about renovation status.",
//         "response": "Renovation is 50% complete."
//       },
//       {
//         "text": "Follow-up question about insurance coverage.",
//         "response": "Insurance coverage is in place."
//       }
//     ]
//   }
// Add comments to a request
router.post('/requests/:RequestId/comments', async (req, res) => {
    try {
        const RequestId = req.params.RequestId;
        const data = req.body;
        const comment = await db.collection('requests').doc(RequestId).collection('comments').add(data);
        res.status(200).send(comment);
    } catch (error) {
        res.status(500).send(error);
    }
}
);

// Fetch all comments of a request
router.get('/requests/:RequestId/comments', async (req, res) => {
    try {
        const RequestId = req.params.RequestId;
        const commentsSnapshot = await db.collection('requests').doc(RequestId).collection('comments').get();

        const comments = [];
        commentsSnapshot.forEach(doc => {
            const commentData = doc.data();
            comments.push({ id: doc.id, ...commentData });
        });

        res.status(200).send(comments);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Fetch all comments of all requests
router.get('/AllRequests/comments', async (req, res) => {
    try {
        const comments = [];
        const commentsSnapshot = await db.collectionGroup('comments').get();
        commentsSnapshot.forEach(doc => {
            const commentData = doc.data();
            comments.push({ id: doc.id, ...commentData });
        });
        res.status(200).send(comments);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;