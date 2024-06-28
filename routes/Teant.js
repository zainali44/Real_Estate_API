const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const Firestore = require('firebase-admin').firestore;

const db = admin.firestore();

// Teaant routes

// Create a new tenant
router.post('/:propertyId', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenant = req.body;
    tenant.propertyId = propertyId;
    //user array of object
    tenant.createdAt = new Date().toISOString();
    tenant.updatedAt = new Date().toISOString();

    try {
        const tenantRef = await db.collection('tenants').add(tenant);
        tenant.id = tenantRef.id;
        res.json(tenant);
    } catch (error) {
        res.status(400).json({ error: 'Error creating tenant' });
    }   
});

// Add a user to a tenant's sub-collection
router.post('/:propertyId/tenants/Teantuser', async (req, res) => {
    const propertyId = req.params.propertyId;
    const user = req.body;
    user.propertyId = propertyId;
    user.createdAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    // Check if the tenant exists
    const tenant = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    if (tenant.empty) {
        res.status(400).json({ error: 'Tenant does not exist' });
        return;
    }

    // Add the user to the tenant's sub-collection
    try {
        const userRef = await db.collection('tenants').doc(tenant.docs[0].id).collection('Teantuser').add(user);
        user.id = userRef.id;
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

// Get all Teantuser for a specific tenant
router.get('/:propertyId/tenants/Teantuser', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenant = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    if (tenant.empty) {
        res.status(400).json({ error: 'Tenant does not exist' });
        return;
    }

    const Teantuser = await db.collection('tenants').doc(tenant.docs[0].id).collection('Teantuser').get();
    const TeantuserList = Teantuser.docs.map(user => user.data());
    res.json(TeantuserList);
});

// Get all tenants for a specific property
router.get('/:propertyId/tenants', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collectionGroup('Teantuser').get();

    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenantsForProperty = tenantsList.filter(tenant => tenant.propertyId === propertyId);

    res.json(tenantsForProperty);
});

// Get Property details for a specific tenant
router.get('/:userID/tenants/property', async (req, res) => {
    const userID = req.params.userID;
    const tenants = await db.collectionGroup('Teantuser').get();

    const tenantsList = tenants.docs.map(tenant => tenant.data());
    console.log(tenantsList[0].userID);

    const tenant = tenantsList.filter(tenant => tenant.userID === userID);

    if (tenant.length === 0) {
        res.status(400).json({ error: 'Tenant does not exist' });
        return;
    }

    const property = await db.collection('properties').doc(tenant[0].propertyId).get();
    res.json(property.data());
}
);

// Get Monthly rent for a specific tenant
router.get('/:userID/monthly-rent', async (req, res) => {
    const userID = req.params.userID;
    const tenants = await db.collectionGroup('Teantuser').get();

    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenant = tenantsList.filter(tenant => tenant.userID === userID);
    
    if (tenant.length === 0) {
        res.status(400).json({ error: 'Tenant does not exist' });
        return;
    }

    res.json({ monthlyRent: tenant[0].monthlyRent });
});
// Update a tenant
router.put('/properties/:propertyId/tenants/:tenantId', async (req, res) => {
    const tenantId = req.params.tenantId;
    const tenant = req.body;
    tenant.updatedAt = new Date().toISOString();

    try {
        await db.collection('tenants').doc(tenantId).update(tenant);
        res.json({ message: 'Tenant updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating tenant' });
    }
});

// Delete a tenant
router.delete('/properties/:propertyId/tenants/:tenantId', async (req, res) => {
    const tenantId = req.params.tenantId;

    try {
        await db.collection('tenants').doc(tenantId).delete();
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting tenant' });
    }
});

// Set up a billing cycle for a tenant
router.post('/properties/:propertyId/tenants/:tenantId/billing', async (req, res) => {
    const tenantId = req.params.tenantId;
    const tenant = await db.collection('tenants').doc(tenantId).get();
    const tenantData = tenant.data();
    const nextBillingDate = new Date(tenantData.nextBillingDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    try {
        await db.collection('tenants').doc(tenantId).update({ nextBillingDate: nextBillingDate.toISOString() });
        res.json({ message: 'Billing cycle set up successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error setting up billing cycle' });
    }
});

// Get all tenants with billing due
router.get('/properties/:propertyId/tenants/billing-due', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenantsBillingDue = tenantsList.filter(tenant => new Date(tenant.nextBillingDate) <= new Date());
    res.json(tenantsBillingDue);
});

// Get all tenants with billing due in the next 7 days
router.get('/properties/:propertyId/tenants/billing-due-soon', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenantsBillingDueSoon = tenantsList.filter(tenant => {
        const nextBillingDate = new Date(tenant.nextBillingDate);
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return nextBillingDate <= nextWeek && nextBillingDate >= today;
    });
    res.json(tenantsBillingDueSoon);
});

// Send due billing reminder to tenants
router.post('/properties/:propertyId/tenants/billing-due-reminder', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenantsBillingDue = tenantsList.filter(tenant => new Date(tenant.nextBillingDate) <= new Date());

    // Send email to tenants
    res.json({ message: 'Billing due reminder sent successfully' });
});

// Send billing due soon reminder to tenants
router.post('/properties/:propertyId/tenants/billing-due-soon-reminder', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());
    const tenantsBillingDueSoon = tenantsList.filter(tenant => {
        const nextBillingDate = new Date(tenant.nextBillingDate);
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return nextBillingDate <= nextWeek && nextBillingDate >= today;
    });

    // Send email to tenants
    res.json({ message: 'Billing due soon reminder sent successfully' });
});

// Send billing receipt to tenants after billing cycle make an template
router.post('/properties/:propertyId/tenants/billing-receipt', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());

    // Send email to tenants
    res.json({ message: 'Billing receipt sent successfully' });
});

module.exports = router;