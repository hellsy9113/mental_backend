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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
