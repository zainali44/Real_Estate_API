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
router.post('/:propertyId/tenants/users', async (req, res) => {
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
        const userRef = await db.collection('tenants').doc(tenant.docs[0].id).collection('users').add(user);
        user.id = userRef.id;
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

// Get all users for a specific tenant
router.get('/:propertyId/tenants/users', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenant = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    if (tenant.empty) {
        res.status(400).json({ error: 'Tenant does not exist' });
        return;
    }

    const users = await db.collection('tenants').doc(tenant.docs[0].id).collection('users').get();
    const usersList = users.docs.map(user => user.data());
    res.json(usersList);
});

// Get all tenants for a specific property
router.get('/:propertyId/tenants', async (req, res) => {
    const propertyId = req.params.propertyId;
    const tenants = await db.collection('tenants').where('propertyId', '==', propertyId).get();
    const tenantsList = tenants.docs.map(tenant => tenant.data());
    res.json(tenantsList);
});

// Get details of a specific tenant
router.get('/properties/:propertyId/tenants/:tenantId', async (req, res) => {
    const tenantId = req.params.tenantId;
    const tenant = await db.collection('tenants').doc(tenantId).get();
    res.json(tenant.data());
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

// Create a Ticket for a tenant support
router.post('/properties/:propertyId/tenants/:tenantId/tickets', async (req, res) => {
    const tenantId = req.params.tenantId;
    const { subject, message } = req.body;
    const ticketData = {
        subject,
        message,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        const ticketRef = await db.collection('tickets').add(ticketData);
        res.json({ ticketId: ticketRef.id });
    } catch (error) {
        res.status(500).json({ error: 'Error creating ticket' });
    }
});

// Get all tickets for a specific tenant
router.get('/properties/:propertyId/tenants/:tenantId/tickets', async (req, res) => {
    const tenantId = req.params.tenantId;
    const tickets = await db.collection('tickets').where('tenantId', '==', tenantId).get();
    const ticketsList = tickets.docs.map(ticket => ticket.data());
    res.json(ticketsList);
});

// Get details of a specific
router.get('/properties/:propertyId/tenants/:tenantId/tickets/:ticketId', async (req, res) => {
    const ticketId = req.params.ticketId;
    const ticket = await db.collection('tickets').doc(ticketId).get();
    res.json(ticket.data());
});

// Respond to a ticket
router.put('/properties/:propertyId/tenants/:tenantId/tickets/:ticketId', async (req, res) => {
    const ticketId = req.params.ticketId;
    const ticket = req.body;
    ticket.updatedAt = new Date().toISOString();

    try {
        await db.collection('tickets').doc(ticketId).update(ticket);
        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating ticket' });
    }
});

module.exports = router;
