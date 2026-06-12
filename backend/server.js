require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const setupSwagger = require('./middleware/swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

setupSwagger(app);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/trips', require('./routes/trip.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));
app.use('/api/locations', require('./routes/location.routes'));

app.use(errorHandler);

// Serve frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('/{*path}', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 3001, () =>
      console.log(`Server running on port ${process.env.PORT || 3001}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
