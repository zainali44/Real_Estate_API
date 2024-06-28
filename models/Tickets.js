const mongoose = require('mongoose');

// Define the schema for each comment
const commentSchema = new mongoose.Schema({
    comment: { type: String},
    commentedBy: { type: String},
    commentDate: { type: Date, default: Date.now }
});

// Define the main ticket schema including TicketComments as an array of commentSchema
const ticketSchema = new mongoose.Schema({
    TicketId: { type: String},
    UserId: { type: String},
    TicketType: { type: String},
    TicketStatus: { type: String},
    TicketPriority: { type: String},
    TicketSubject: { type: String},
    TicketDescription: { type: String},
    TicketDate: { type: Date},
    TicketDueDate: { type: Date},
    TicketAssignedTo: { type: String,},
    TicketCreatedBy: { type: String},
    TicketClosedBy: { type: String },
    TicketClosedDate: { type: Date },
    TicketComments: [commentSchema], // Array of comment objects
    TicketAttachments: { type: String},
    TicketHistory: { type: String},
});

// Create Ticket model based on ticketSchema
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
