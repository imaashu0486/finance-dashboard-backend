const financialRecordService = require('../services/financialRecord.service');
const asyncHandler = require('../utils/asyncHandler');
const { respondOk } = require('../utils/response');

const createRecord = asyncHandler(async (req, res) => {
  const createdRecord = await financialRecordService.createRecord(req.body);
  return respondOk(res, 201, 'Financial record created successfully', { record: createdRecord });
});

const getAllRecords = asyncHandler(async (req, res) => {
  const ledgerPage = await financialRecordService.getAllRecords(req.query);
  return respondOk(res, 200, 'Financial records fetched successfully', {
    records: ledgerPage.items,
    items: ledgerPage.items,
    pagination: ledgerPage.meta
  });
});

const updateRecord = asyncHandler(async (req, res) => {
  const updatedRecord = await financialRecordService.updateRecord(req.params.id, req.body);
  return respondOk(res, 200, 'Financial record updated successfully', { record: updatedRecord });
});

const deleteRecord = asyncHandler(async (req, res) => {
  const archivedRecord = await financialRecordService.deleteRecord(req.params.id);
  return respondOk(res, 200, 'Financial record deleted successfully', {
    id: archivedRecord._id,
    isDeleted: archivedRecord.isDeleted
  });
});

module.exports = {
  createRecord,
  getAllRecords,
  updateRecord,
  deleteRecord
};
