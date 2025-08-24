const pool = require("../db");
// Sell a live car: remove from live_cars and mark as sold, save sale details
exports.sellLiveCar = (req, res) => {
  // Helper to convert empty string to null
  const toNullIfEmpty = v => v === "" ? null : v;
  const { id } = req.params;
  // Use req.body for text fields, req.files for documents
  // All fields from formData are strings in req.body
  const salePrice = req.body.salePrice;
  const tokenAmount = req.body.tokenAmount;
  const tokenPaymentType = req.body.tokenPaymentType;
  const firstAmount = req.body.firstAmount;
  const firstPaymentType = req.body.firstPaymentType;
  const transferredAmount = req.body.transferredAmount;
  const transferredPaymentType = req.body.transferredPaymentType;
  const loanAmount = req.body.loanAmount;
  const totalAmount = req.body.totalAmount;
  const remainingAmount = req.body.remainingAmount;
  const newOwnerName = req.body.newOwnerName;
  const newOwnerPhone = req.body.newOwnerPhone;
  const newOwnerPhone2 = req.body.newOwnerPhone2;
  const newOwnerEmail = req.body.newOwnerEmail;
  const newOwnerAddress = req.body.newOwnerAddress;
  const soldAt = req.body.soldAt;

  // Build newOwnerDocuments from file paths
  let newOwnerDocuments = null;
  if (req.files) {
    newOwnerDocuments = {
      deliveryPhoto: req.files['deliveryPhoto'] ? req.files['deliveryPhoto'][0].path : null,
      aadhaarCard: req.files['aadhaarCard'] ? req.files['aadhaarCard'][0].path : null,
      panCard: req.files['panCard'] ? req.files['panCard'][0].path : null,
      rcBook: req.files['rcBook'] ? req.files['rcBook'][0].path : null,
      loanNoc: req.files['loanNoc'] ? req.files['loanNoc'][0].path : null
    };
  }

  // Debug logging for incoming request
  console.log('SellLiveCar called for car_id:', id);
  console.log('Request body:', req.body);
  if (req.files) {
    Object.entries(req.files).forEach(([field, files]) => {
      files.forEach(file => {
        console.log(`File field: ${field}, filename: ${file.originalname}, saved as: ${file.path}`);
      });
    });
  } else {
    console.log('No files uploaded');
  }

  // Remove from live_cars
  pool.query("DELETE FROM live_cars WHERE car_id = ?", [id], (err, result) => {
    if (err) {
      console.error('Error removing from live_cars:', err);
      return res.status(500).json({ error: 'Failed to remove from live cars', details: err.message });
    }
    // Mark as sold in cars table and save sale details
    const updateSql = `
      UPDATE cars SET
        sold = 1,
        sale_price = ?,
        token_amount = ?,
        token_payment_type = ?,
        first_amount = ?,
        first_payment_type = ?,
        transferred_amount = ?,
        transferred_payment_type = ?,
        loan_amount = ?,
        total_amount = ?,
        remainingAmount = ?,  
        new_owner_phone = ?,
        newOwnerPhone2 = ?,
        new_owner_email = ?,
        new_owner_address = ?,
        new_owner_documents = ?,
        sale_date = ?
      WHERE id = ?
    `;
    pool.query(
      updateSql,
      [
        toNullIfEmpty(salePrice),
        toNullIfEmpty(tokenAmount),
        toNullIfEmpty(tokenPaymentType),
        toNullIfEmpty(firstAmount),
        toNullIfEmpty(firstPaymentType),
        toNullIfEmpty(transferredAmount),
        toNullIfEmpty(transferredPaymentType),
        toNullIfEmpty(loanAmount),
        toNullIfEmpty(totalAmount),
        toNullIfEmpty(remainingAmount),
        toNullIfEmpty(newOwnerPhone),
        toNullIfEmpty(newOwnerPhone2),
        toNullIfEmpty(newOwnerEmail),
        toNullIfEmpty(newOwnerAddress),
        newOwnerDocuments ? JSON.stringify(newOwnerDocuments) : null,
        soldAt || new Date(),
        id
      ],
      (err2, result2) => {
        if (err2) {
          console.error('Error updating cars table:', err2);
          return res.status(500).json({ error: 'Failed to mark car as sold', details: err2.message });
        }
        res.json({ success: true });
      }
    );
  });
};
// ...existing code...

// Get all live cars (with car info, but no sell price or expenditure)
exports.getLiveCars = (req, res) => {
  const sql = `
    SELECT c.*, l.live_price, l.live_start
    FROM live_cars l
    JOIN cars c ON l.car_id = c.id
  `;
  pool.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch live cars' });
    // Parse photos and set full URLs
    const filtered = results.map(car => {
      let photos = [];
      if (car.photos && typeof car.photos === 'string') {
        try {
          const parsed = JSON.parse(car.photos);
          photos = parsed
            .filter(photo => photo && photo.trim() !== '') // Filter out empty values
            .map(photo =>
              photo && !photo.startsWith('http')
                ? `${req.protocol}://${req.get('host')}/uploads/photos/${photo}`
                : photo
            );
        } catch {
          photos = [];
        }
      }
      const {
        sale_price, saleDate, expenditures, expenditure, // remove auction/sell fields
        ...rest
      } = car;
      return {
        ...rest,
        price: car.live_price, // override price with live_price
        photos
      };
    });
    res.json(filtered);
  });
};

// Make a car live (set new price)
exports.makeCarLive = (req, res) => {
  const { id } = req.params;
  const { live_price } = req.body;
  const sql = `
    INSERT INTO live_cars (car_id, live_price)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE live_price = VALUES(live_price)
  `;
  pool.query(sql, [id, live_price], (err, result) => {
    if (err) {
          console.error('Error in makeCarLive:', err);
      return res.status(500).json({ error: 'Failed to make car live', details: err.message });
    }
    res.json({ success: true });
  });
};
