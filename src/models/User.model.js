/**
 * User Model
 * Data model for user authentication
 * Follows Single Responsibility Principle: Only handles user data structure
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env.config');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [50, 'Username must not exceed 50 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores'
      ],
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow multiple null values but unique non-null values
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Don't return password by default
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: {
      transform: (doc, ret) => {
        // Remove sensitive fields from JSON response
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

/**
 * Virtual property to check if account is locked
 */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Pre-save hook to hash password
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with configured rounds
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to increment failed login attempts
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Increment attempts
  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account if max attempts exceeded
  if (this.failedLoginAttempts + 1 >= config.security.maxLoginAttempts) {
    updates.$set = { lockUntil: Date.now() + config.security.lockoutDuration };
  }

  return this.updateOne(updates);
};

/**
 * Method to reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Static method to find by username
 */
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username }).select('+password');
};

const User = mongoose.model('User', userSchema);

module.exports = User;

