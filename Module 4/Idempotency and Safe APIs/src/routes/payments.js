'use strict';

// routes/payments.js

const router = require('express').Router();

const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {

  // 1. Check for Idempotency-Key
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  // 2. Check if the key already exists
  if (idempotency.has(key)) {
    const savedResponse = idempotency.get(key);

    return res.status(savedResponse.status).json(savedResponse.body);
  }

  // 3. Create a new charge
  const amount = req.body && req.body.amount;

  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };

  charges.push(charge);

  // 4. Store the response
  const body = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  idempotency.set(key, {
    status: 201,
    body
  });

  return res.status(201).json(body);
});

module.exports = router;
