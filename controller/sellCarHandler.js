// Sell a car: mark as sold and update new owner info
exports.sellCar = (req, res) => {
  const toNullIfEmpty = v => v === "" ? null : v;
  const { id } = req.params;
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
  const newOwnerPhone = req.body.newOwnerPhone;
  const newOwnerPhone2 = req.body.newOwnerPhone2;
  const newOwnerEmail = req.body.newOwnerEmail;
  const newOwnerAddress = req.body.newOwnerAddress;
  const soldAt = req.body.soldAt;
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
  db.query(
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
    (err, result) => {
      if (err) {
        console.error('Error updating car as sold:', err);
        return res.status(500).json({ error: 'Failed to mark car as sold', details: err.message });
      }
      res.json({ success: true });
    }
  );
};
