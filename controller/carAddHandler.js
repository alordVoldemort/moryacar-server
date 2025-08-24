// This handler is separated for the POST /api/cars/add route to keep controller logic clean
const db = require("../db");

const handler = (req, res) => {
  const {
    brand,
    model,
    variant,
    year,
    manufacturingMonth,
    numberOfOwners,
    colour,
    fuelType,
    transmission,
    registrationNumber,
    registrationPlace,
    price,
    kilometersDriven,
    insuranceType,
    engineNumber,
    chassisNumber,
    clientMobile
  } = req.body;

  // Debug: log all received file field names
  if (req.files) {
    console.log('Received file fields:', Object.keys(req.files));
    console.log('Photos received:', req.files.photos ? req.files.photos.length : 0);
    if (req.files.photos) {
      req.files.photos.forEach((photo, index) => {
        console.log(`Photo ${index + 1}: ${photo.filename}`);
      });
    }
  }
  const photos = req.files.photos ? req.files.photos.map((f) => f.filename) : [];
  console.log('Photos array to be saved:', photos);
  // Only keep these in documents JSON
  const documents = {
    aadhaarCard: req.files.aadhaarCard?.[0]?.filename || null,
    panCard: req.files.panCard?.[0]?.filename || null,
    rcBook: req.files.rcBook?.[0]?.filename || null,
    insurancePapers: req.files.insurancePapers?.[0]?.filename || null,
  };

  // New fields for forms (separate columns)
  const form29Front = req.files.form29Front?.[0]?.filename || null;
  const form29Back = req.files.form29Back?.[0]?.filename || null;
  const form28Front = req.files.form28Front?.[0]?.filename || null;
  const form28Back = req.files.form28Back?.[0]?.filename || null;
  const form30Front = req.files.form30Front?.[0]?.filename || null;

  const sql = `
    INSERT INTO cars 
    (photos, brand, model, variant, year, manufacturingMonth, numberOfOwners, colour, fuelType, transmission, registrationNumber, registrationPlace, price, kilometersDriven, insuranceType, engineNumber, chassisNumber, clientMobile, documents, form29Front, form29Back, form28Front, form28Back, form30Front)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      JSON.stringify(photos),
      brand,
      model,
      variant,
      year,
      manufacturingMonth,
      numberOfOwners,
      colour,
      fuelType,
      transmission,
      registrationNumber,
      registrationPlace,
      price,
      kilometersDriven,
      insuranceType,
      engineNumber,
      chassisNumber,
      clientMobile,
      JSON.stringify(documents),
      form29Front,
      form29Back,
      form28Front,
      form28Back,
      form30Front
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error adding car" });
      }
      res.json({ message: "Car added successfully", carId: result.insertId });
    }
  );
};

module.exports = handler;
