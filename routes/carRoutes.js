const express = require("express");
const multer = require("multer");
const path = require("path");


const carController = require("../controller/carController");
const liveCarController = require("../controller/liveCarController");

const router = express.Router();

// Single multer storage with dynamic destination
const fs = require("fs");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const photoFields = ["photos"];
    const docFields = [ 
      "aadhaarCard",
      "panCard",
      "rcBook",
      "insurancePapers",
      "form29Front",
      "form29Back",
      "form28Front",
      "form28Back",
      "form30Front",
      "deliveryPhoto",
      "loanNoc"
    ];
    let dest = null;
    if (photoFields.includes(file.fieldname)) {
      dest = "uploads/photos/";
    } else if (docFields.includes(file.fieldname)) {
      dest = "uploads/documents/";
    } else {
      return cb(new Error("Unexpected field: " + file.fieldname));
    }
    // Ensure directory exists
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Check if this is for a sell operation (from the sell route)
    if (req.route && req.route.path && req.route.path.includes('/sell')) {
      // Generate filename based on document type for sold car documents
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const uniqueString = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      
      let docType = '';
      switch(file.fieldname) {
        case 'aadhaarCard':
          docType = 'adhar';
          break;
        case 'panCard':
          docType = 'pan';
          break;
        case 'rcBook':
          docType = 'rc';
          break;
        case 'deliveryPhoto':
          docType = 'delivery';
          break;
        case 'loanNoc':
          docType = 'loan_noc';
          break;
        default:
          docType = file.fieldname;
      }
      
      const filename = `morya_sold_${docType}_${date}_${uniqueString}${fileExtension}`;
      cb(null, filename);
    } else {
      // Default filename for other operations (add car, etc.)
      cb(null, Date.now() + "-" + file.originalname);
    }
  },
});

const upload = multer({ storage });

// Add Car
router.post(
  "/add",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "rcBook", maxCount: 1 },
    { name: "insurancePapers", maxCount: 1 },
    { name: "form29Front", maxCount: 1 },
    { name: "form29Back", maxCount: 1 },
    { name: "form28Front", maxCount: 1 },
    { name: "form28Back", maxCount: 1 },
    { name: "form30Front", maxCount: 1 },
  ]),
  require("./../controller/carAddHandler")
);



router.get("/search", carController.searchCars);

// Get all cars (with pagination)
router.get("/", carController.getAllCars);

// Get available (unsold) cars (with pagination)
router.get("/available", carController.getAvailableCars);



// Get sold cars (dummy route, adjust as needed)
router.get("/sold", carController.getSoldCars);


// Get all live cars (from live_cars table)
router.get("/live", liveCarController.getLiveCars);


// Make a car live (add to live_cars table)
router.put("/:id/live", liveCarController.makeCarLive);

// Sell a live car (remove from live_cars and mark as sold)
router.put(
  "/:id/sell",
  upload.fields([
    { name: "deliveryPhoto", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "rcBook", maxCount: 1 },
    { name: "loanNoc", maxCount: 1 }
  ]),
  (req, res, next) => {
    console.log(req.body, 'aniket')
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    // All files are now optional, no validation needed
    next();
  },
  liveCarController.sellLiveCar
);

// Get car by ID

// Sell a car (not live)
router.put(
  "/:id/sell-direct",
  upload.fields([
    { name: "deliveryPhoto", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "rcBook", maxCount: 1 },
    { name: "loanNoc", maxCount: 1 }
  ]),
  (req, res, next) => {
    console.log(req.body, 'sell-direct')
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    next();
  },
  require('../controller/sellCarHandler').sellCar
);

// Get car by ID
router.get("/:id", carController.getCarById);

// Update payment details for a sold car
router.put('/:id/payment', carController.updatePayment);

// Expenditures for a car - forward to expenditure route handler for convenience
const expenditureController = require('../controller/expenditureController');
// GET /api/cars/:id/expenditures
router.get('/:id/expenditures', (req, res) => {
  // reuse the expenditure controller which expects car_id param named car_id
  // adapt param name and call handler
  req.params.car_id = req.params.id;
  return expenditureController.getExpenditureByCarId(req, res);
});


module.exports = router;
