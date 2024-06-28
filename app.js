const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv/config');

var serviceAccount = require("./helpers/madproject-dfff5-firebase-adminsdk-faee9-473c8552e2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json()); // Add this line to parse JSON bodies

app.use(cors());
app.options('*', cors());

const api = process.env.API_URL;

// MongoDB connection
const mongoURI = 'mongodb+srv://zain:9VQz54CDNRLJU7eR@cluster0.nmh90tv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, {
  dbName: 'RealEstate',
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const notificationsRoute = require('./routes/Notifications');
const auctionsRoute = require('./routes/Auction');
const tenantsRoute = require('./routes/Teant');
const usersRoute = require('./routes/users');
const distributionRoute = require('./routes/Distribution');
const messagesRoute = require('./routes/messages');
const TicketRoute = require('./routes/Ticket');
const LeadsRoute = require('./routes/Leads');
const propertiesRoute = require('./routes/properties');

app.use(`${api}/notifications`, notificationsRoute);
app.use(`${api}/auctions`, auctionsRoute);
app.use(`${api}/tenants`, tenantsRoute);
app.use(`${api}/users`, usersRoute);
app.use(`${api}/distribution`, distributionRoute);
app.use(`${api}/messages`, messagesRoute);
app.use(`${api}/tickets`, TicketRoute);
app.use(`${api}/leads`, LeadsRoute);
app.use(`${api}/properties`, propertiesRoute);

// Check Firebase connection
app.get(`${api}/checkFirebaseConnection`, (req, res) => {
  try {
    // Attempt to get a list of users from Firebase
    admin.auth().listUsers(1)
      .then(() => {
        res.status(200).json({ success: true, message: 'Firebase connection is successful' });
      })
      .catch(error => {
        console.error('Firebase connection failed:', error);
        res.status(500).json({ success: false, message: 'Firebase connection failed' });
      });
  } catch (error) {
    console.error('Error checking Firebase connection:', error);
    res.status(500).json({ success: false, message: 'Error checking Firebase connection' });
  }
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
