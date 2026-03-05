// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Name is required'],
//       trim: true,
//       minlength: 2
//     },

//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       unique: true,
//       lowercase: true,
//       trim: true
//     },

//     password: {
//       type: String,
//       required: [true, 'Password is required'],
//       minlength: 6
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// module.exports = mongoose.model('User', userSchema);



const mongoose = require('mongoose');

const ROLES = ['student', 'counsellor', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6
    },

    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be student, counsellor, or admin'
      },
      default: 'student'
    },

    bio: {
      type: String,
      default: '',
      maxlength: 300
    },

    // Hex colour string for the avatar background e.g. "#6366F1"
    avatarColor: {
      type: String,
      default: ''
    },

    // Academic identity — drives future forum/event personalisation per institution
    institution: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150
    },

    course: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },

    // Course start year e.g. 2023 — current year is derived on the frontend
    courseStartYear: {
      type: Number,
      default: null,
      min: 1980,
      max: 2100
    }
  },
  {
    timestamps: true
  }
);

// Indexes for future forum/events — quickly find all users in same institution/course
userSchema.index({ institution: 1 });
userSchema.index({ institution: 1, course: 1 });

module.exports = mongoose.model('User', userSchema);