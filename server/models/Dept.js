const mongoose = require('mongoose');

const deptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dept', default: null },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

deptSchema.index({ companyId: 1, name: 1, parentId: 1 }, { unique: true });

module.exports = mongoose.model('Dept', deptSchema);
