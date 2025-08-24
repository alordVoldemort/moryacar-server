const db = require("../db");
const path = require('path');

// Get all live cars
exports.getLiveCars = (req, res) => {
  db.query('SELECT * FROM cars WHERE is_live_car = 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch live cars' });
    res.json(results);
  });   
};

// Make a car live (set is_live_car=1 and update price)
exports.makeCarLive = (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  db.query(
    'UPDATE cars SET is_live_car = 1, price = ? WHERE id = ?',
    [price, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to update car as live' });
      res.json({ success: true });
    }
  );
};

// Get car by ID (with live_price if live)
exports.getCarById = (req, res) => {
  const carId = req.params.id;
  const sql = `
    SELECT c.*, l.live_price
    FROM cars c
    LEFT JOIN live_cars l ON c.id = l.car_id
    WHERE c.id = ?
  `;
  db.query(sql, [carId], (err, results) => {
    if (err) {
      console.error('Error fetching car by ID:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    let car = results[0];

    // ✅ Same parsing logic you already had
    try {
      if (car.photos && typeof car.photos === 'string') {
        car.photos = JSON.parse(car.photos);
      }
      if (Array.isArray(car.photos)) {
        car.photos = car.photos
          .filter(photo => photo && photo.trim() !== '')
          .map(photo => {
            if (photo && !photo.startsWith('http')) {
              return `${req.protocol}://${req.get('host')}/uploads/photos/${photo}`;
            }
            return photo;
          });
      } else {
        car.photos = [];
      }

      // Documents
      if (car.documents) {
        try {
          const docObj = typeof car.documents === 'string' ? JSON.parse(car.documents) : car.documents;
          const docOut = {};
          Object.entries(docObj).forEach(([key, filename]) => {
            if (filename) {
              // Normalize filename: if DB contains a path (e.g. uploads/documents/...), use basename
              let cleanFilename = filename;
              if (typeof cleanFilename === 'string') {
                // If an absolute or full URL was stored, use it directly
                if (cleanFilename.startsWith('http')) {
                  docOut[key] = {
                    url: cleanFilename,
                    type: (cleanFilename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
                    name: path.basename(cleanFilename)
                  };
                  return;
                }
                // Strip any leading folders like uploads/documents/ or /uploads/documents/
                cleanFilename = path.basename(cleanFilename);
              }
              const ext = cleanFilename.split('.').pop().toLowerCase();
              let type = '';
              if (ext === 'pdf') type = 'pdf';
              else if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) type = 'image';
              docOut[key] = {
                url: `${req.protocol}://${req.get('host')}/uploads/documents/${cleanFilename}`,
                type,
                name: cleanFilename
              };
            }
          });
          car.documents = docOut;
        } catch (e) {
          car.documents = {};
        }
      } else {
        car.documents = {};
      }

      // OtherInfo
      if (car.otherInfo && typeof car.otherInfo === 'string') {
        try { car.otherInfo = JSON.parse(car.otherInfo); } catch { car.otherInfo = {}; }
      } else if (!car.otherInfo) {
        car.otherInfo = {};
      }

      // RegistrationFitness
      if (car.registrationFitness && typeof car.registrationFitness === 'string') {
        try { car.registrationFitness = JSON.parse(car.registrationFitness); } catch { car.registrationFitness = {}; }
      } else if (!car.registrationFitness) {
        car.registrationFitness = {};
      }

      // ExteriorIssues
      if (car.exteriorIssues && typeof car.exteriorIssues === 'string') {
        try { car.exteriorIssues = JSON.parse(car.exteriorIssues); } catch { car.exteriorIssues = []; }
      } else if (!car.exteriorIssues) {
        car.exteriorIssues = [];
      }

      // Tyres
      if (car.Tyres && typeof car.Tyres === 'string') {
        try { car.Tyres = JSON.parse(car.Tyres); } catch { car.Tyres = []; }
      } else if (!car.Tyres) {
        car.Tyres = [];
      }

      // New Owner Documents - normalize similar to documents above
      if (car.new_owner_documents && typeof car.new_owner_documents === 'string') {
        try {
          const docObj = JSON.parse(car.new_owner_documents);
          const docOut = {};
          Object.entries(docObj).forEach(([key, filename]) => {
            if (filename) {
              let cleanFilename = filename;
              if (typeof cleanFilename === 'string') {
                if (cleanFilename.startsWith('http')) {
                  docOut[key] = {
                    url: cleanFilename,
                    type: (cleanFilename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
                    name: path.basename(cleanFilename)
                  };
                  return;
                }
                cleanFilename = path.basename(cleanFilename);
              }
              const ext = cleanFilename.split('.').pop().toLowerCase();
              let type = '';
              if (ext === 'pdf') type = 'pdf';
              else if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) type = 'image';
              docOut[key] = {
                url: `${req.protocol}://${req.get('host')}/uploads/documents/${cleanFilename}`,
                type,
                name: cleanFilename
              };
            }
          });
          car.new_owner_documents = docOut;
        } catch (e) {
          car.new_owner_documents = {};
        }
      } else if (!car.new_owner_documents) {
        car.new_owner_documents = {};
      }
    } catch (parseErr) {
      car.photos = car.photos || [];
      car.documents = car.documents || {};
      car.otherInfo = car.otherInfo || {};
      car.registrationFitness = car.registrationFitness || {};
      car.exteriorIssues = car.exteriorIssues || [];
      car.Tyres = car.Tyres || [];
      car.new_owner_documents = car.new_owner_documents || {};
    }

    res.status(200).json(car);
  });
};

// Get available (unsold) cars with pagination
exports.getAvailableCars = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const includePhotos = req.query.includePhotos === 'true';

  let sql = `SELECT id, brand, model, variant, year, manufacturingMonth, numberOfOwners, colour, fuelType, transmission, registrationNumber, registrationPlace, price, kilometersDriven, insuranceType, documents, form29Front, form29Back, form28Front, form28Back, form30Front, created_at, sold, sale_price`;
  if (includePhotos) sql += ', photos';
  sql += ' FROM cars WHERE sold = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?';

  db.query(sql, [limit, offset], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching available cars" });
    }
    const processedCars = results.map(car => {
      if (includePhotos && car.photos) {
        try {
          if (typeof car.photos === 'string') {
            car.photos = JSON.parse(car.photos);
          }
          if (Array.isArray(car.photos)) {
            car.photos = car.photos
              .filter(photo => photo && photo.trim() !== '')
              .map(photo => {
                if (photo && !photo.startsWith('http')) {
                  return `${req.protocol}://${req.get('host')}/uploads/photos/${photo}`;
                }
                return photo;
              });
          } else {
            car.photos = [];
          }
        } catch (e) {
          car.photos = [];
        }
      }
      return car;
    });
    res.json({ cars: processedCars, pagination: { page, limit, total: processedCars.length } });
  });
};

// Get all cars with pagination
exports.getAllCars = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const includePhotos = req.query.includePhotos === 'true';

  let sql = `SELECT id, brand, model, variant, year, manufacturingMonth, numberOfOwners, colour, fuelType, transmission, registrationNumber, registrationPlace, price, kilometersDriven, insuranceType, documents, form29Front, form29Back, form28Front, form28Back, form30Front, created_at, sold, sale_price`;
  if (includePhotos) sql += ', photos';
  sql += ' FROM cars ORDER BY created_at DESC LIMIT ? OFFSET ?';


// (updatePayment moved below to module scope)
  const countSql = 'SELECT COUNT(*) as total FROM cars';

  db.query(countSql, (countErr, countResult) => {
    if (countErr) {
      console.error(countErr);
      return res.status(500).json({ message: "Error fetching car count" });
    }
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    db.query(sql, [limit, offset], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error fetching cars" });
      }
      const processedCars = results.map(car => {
        if (includePhotos && car.photos) {
          try {
            if (typeof car.photos === 'string') {
              car.photos = JSON.parse(car.photos);
            }
            if (Array.isArray(car.photos)) {
              car.photos = car.photos
                .filter(photo => photo && photo.trim() !== '')
                .map(photo => {
                  if (photo && !photo.startsWith('http')) {
                    return `${req.protocol}://${req.get('host')}/uploads/photos/${photo}`;
                  }
                  return photo;
                });
            } else {
              car.photos = [];
            }
          } catch (e) {
            car.photos = [];
          }
        }
        return car;
      });
      res.json({
        cars: processedCars,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    });
  });
};

// Get sold cars
exports.getSoldCars = (req, res) => {
  db.query('SELECT * FROM cars WHERE sold = 1', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching sold cars" });
    }
    res.json(results);
  });
};

// Update only payment-related fields for a car (used to edit payment after a sale)
exports.updatePayment = (req, res) => {
  const toNullIfEmpty = v => v === '' ? null : v;
  const { id } = req.params;
  const {
    tokenAmount,
    tokenPaymentType,
    firstAmount,
    firstPaymentType,
    transferredAmount,
    transferredPaymentType,
    loanAmount,
    totalAmount,
    remainingAmount,
    salePrice
  } = req.body;

  const updateSql = `
    UPDATE cars SET
      token_amount = ?,
      token_payment_type = ?,
      first_amount = ?,
      first_payment_type = ?,
      transferred_amount = ?,
      transferred_payment_type = ?,
      loan_amount = ?,
      total_amount = ?,
      remainingAmount = ?,
      sale_price = ?
    WHERE id = ?
  `;

  db.query(
    updateSql,
    [
      toNullIfEmpty(tokenAmount),
      toNullIfEmpty(tokenPaymentType),
      toNullIfEmpty(firstAmount),
      toNullIfEmpty(firstPaymentType),
      toNullIfEmpty(transferredAmount),
      toNullIfEmpty(transferredPaymentType),
      toNullIfEmpty(loanAmount),
      toNullIfEmpty(totalAmount),
      toNullIfEmpty(remainingAmount),
      toNullIfEmpty(salePrice),
      id
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating payment details:', err);
        return res.status(500).json({ message: 'Failed to update payment details', details: err.message });
      }
      res.json({ success: true });
    }
  );
};

// ---------------- New Added Code ----------------

// ✅ Search cars by registration number
// Search cars by number, brand, or model
// controllers/carController.js

exports.searchCars = (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  const searchTerm = `%${query}%`;

  const sql = `
    SELECT * FROM cars
    WHERE registrationNumber LIKE ? 
       OR brand LIKE ? 
       OR model LIKE ? 
       OR variant LIKE ? 
       OR colour LIKE ? 
       OR fuelType LIKE ?
  `;

  db.query(
    sql,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
    (err, results) => {
      if (err) {
        console.error("Error searching cars:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results);
    }
  );
};


// ✅ Simple get all cars (no pagination)
exports.getCars = (req, res) => {
  const sql = "SELECT * FROM cars";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB fetch error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ cars: results });
  });
};
