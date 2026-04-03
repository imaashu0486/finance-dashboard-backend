const express = require('express');

const financialRecordController = require('../controllers/financialRecord.controller');
const requireAuth = require('../middleware/auth.middleware');
const allowPermissions = require('../middleware/permission.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createFinancialRecordSchema,
  updateFinancialRecordSchema,
  financialRecordQuerySchema
} = require('../validators/financialRecord.validator');

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  allowPermissions('create'),
  validate(createFinancialRecordSchema),
  financialRecordController.createRecord
);

router.get(
  '/',
  allowPermissions('read'),
  validate(financialRecordQuerySchema, 'query'),
  financialRecordController.getAllRecords
);

router.patch(
  '/:id',
  allowPermissions('update'),
  validate(updateFinancialRecordSchema),
  financialRecordController.updateRecord
);

router.delete('/:id', allowPermissions('delete'), financialRecordController.deleteRecord);

module.exports = router;
