const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true
    },
    replacedByTokenId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto-delete expired sessions for storage hygiene.
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthSession', authSessionSchema);
