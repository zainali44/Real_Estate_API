const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Ticket = require('../models/Tickets');

// Get all tickets
router.get('/', async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get one ticket
router.get('/:TicketId', async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ TicketId: req.params.TicketId });
        if (ticket == null) {
            return res.status(404).json({ message: 'Cannot find ticket' });
        }
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new ticket
router.post('/', async (req, res) => {
    const ticket = new Ticket({
        TicketId: req.body.TicketId,
        UserId: req.body.UserId,
        TicketType: req.body.TicketType,
        TicketStatus: req.body.TicketStatus,
        TicketPriority: req.body.TicketPriority,
        TicketSubject: req.body.TicketSubject,
        TicketDescription: req.body.TicketDescription,
        TicketDate: req.body.TicketDate,
        TicketDueDate: req.body.TicketDueDate,
        TicketAssignedTo: req.body.TicketAssignedTo,
        TicketCreatedBy: req.body.TicketCreatedBy,
        TicketClosedBy: req.body.TicketClosedBy || null, // Default to null if not provided
        TicketClosedDate: req.body.TicketClosedDate || null, // Default to null if not provided
        TicketComments: req.body.TicketComments,
        TicketAttachments: req.body.TicketAttachments,
        TicketHistory: req.body.TicketHistory,
    });

    try {
        const newTicket = await ticket.save();
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Get all tickets for a specific user
router.get('/user/:UserId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ UserId: req.params.UserId });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update one ticket
router.patch('/:id', getTicket, async (req, res) => {
    if (req.body.TicketId != null) {
        res.ticket.TicketId = req.body.TicketId;
    }
    if (req.body.UserId != null) {
        res.ticket.UserId = req.body.UserId;
    }
    if (req.body.TicketType != null) {
        res.ticket.TicketType = req.body.TicketType;
    }
    if (req.body.TicketStatus != null) {
        res.ticket.TicketStatus = req.body.TicketStatus;
    }
    if (req.body.TicketPriority != null) {
        res.ticket.TicketPriority = req.body.TicketPriority;
    }
    if (req.body.TicketSubject != null) {
        res.ticket.TicketSubject = req.body.TicketSubject;
    }
    if (req.body.TicketDescription != null) {
        res.ticket.TicketDescription = req.body.TicketDescription;
    }
    if (req.body.TicketDate != null) {
        res.ticket.TicketDate = req.body.TicketDate;
    }
    if (req.body.TicketDueDate != null) {
        res.ticket.TicketDueDate = req.body.TicketDueDate;
    }
    if (req.body.TicketAssignedTo != null) {
        res.ticket.TicketAssignedTo = req.body.TicketAssignedTo;
    }
    if (req.body.TicketCreatedBy != null) {
        res.ticket.TicketCreatedBy = req.body.TicketCreatedBy;
    }
    if (req.body.TicketClosedBy != null) {
        res.ticket.TicketClosedBy = req.body.TicketClosedBy;
    }
    if (req.body.TicketClosedDate != null) {
        res.ticket.TicketClosedDate = req.body.TicketClosedDate;
    }
    if (req.body.TicketComments != null) {
        res.ticket.TicketComments = req.body.TicketComments;
    }
    if (req.body.TicketAttachments != null) {
        res.ticket.TicketAttachments = req.body.TicketAttachments;
    }
    if (req.body.TicketHistory != null) {
        res.ticket.TicketHistory = req.body.TicketHistory;
    }
    try {
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete one ticket
router.delete('/:id', getTicket, async (req, res) => {
    try {
        await res.ticket.remove();
        res.json({ message: 'Deleted ticket' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function getTicket(req, res, next) {
    let ticket;
    try {
        ticket = await Ticket.findById(req.params.id);
        if (ticket == null) {
            return res.status(404).json({ message: 'Cannot find ticket' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.ticket = ticket;
    next();
}

// add a comment to a ticket
router.post('/:id/comment', getTicket, async (req, res) => {
    const newComment = {
        comment: req.body.comment,
        commentedBy: req.body.commentedBy,
        commentDate: req.body.commentDate || new Date()
    };

    // console.log("New Comment: ", newComment);



    // Add the new comment to TicketComments array
    res.ticket.TicketComments.push(newComment);

    try {
        // Save the updated ticket with the new comment
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// get all comments for a ticket
router.get('/:id/comments', getTicket, async (req, res) => {
    res.json(res.ticket.TicketComments);
});



// remove a comment from a ticket
router.delete('/:id/comment/:commentId', getTicket, async (req, res) => {
    res.ticket.TicketComments = res.ticket.TicketComments.filter(comment => comment.CommentId != req.params.commentId);
    try {
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// add an attachment to a ticket
router.post('/:id/attachment', getTicket, async (req, res) => {
    res.ticket.TicketAttachments.push(req.body);
    try {
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// remove an attachment from a ticket
router.delete('/:id/attachment/:attachmentId', getTicket, async (req, res) => {
    res.ticket.TicketAttachments = res.ticket.TicketAttachments.filter(attachment => attachment.AttachmentId != req.params.attachmentId);
    try {
        const updatedTicket = await res.ticket.save();
        res.json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


module.exports = router;