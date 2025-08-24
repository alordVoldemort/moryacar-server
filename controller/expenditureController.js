const pool = require('../db');

// Add expenditure for a car
exports.addExpenditure = (req, res) => {
  const { car_id, maintenance, denting, painting, accessories, machine } = req.body;
  if (!car_id) return res.status(400).json({ message: 'car_id is required' });
  const sql = `INSERT INTO expenditures (car_id, maintenance, denting, painting, accessories, machine) VALUES (?, ?, ?, ?, ?, ?)`;
  pool.query(
    sql,
    [car_id, maintenance || 0, denting || 0, painting || 0, accessories || 0, machine || 0],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error adding expenditure' });
      }
      res.json({ message: 'Expenditure added', id: result.insertId });
    }
  );
};

// Get expenditure for a car
exports.getExpenditureByCarId = (req, res) => {
  const car_id = req.params.car_id;
  const sql = `SELECT * FROM expenditures WHERE car_id = ? ORDER BY created_at DESC LIMIT 1`;
  pool.query(sql, [car_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching expenditure' });
    }
    res.json(results[0] || {});
  });
};
