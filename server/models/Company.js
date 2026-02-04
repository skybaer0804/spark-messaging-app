const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  createdAt: { type: Date, default: Date.now },
});

companySchema.index({ workspaceId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Company', companySchema);
