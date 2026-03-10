const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 100 },
    age: { type: Number, required: [true, 'Age is required'], min: [16, 'Must be at least 16'], max: [100, 'Invalid age'] },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say', ''], default: '' },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true, maxlength: 20 },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 100 },
    collegeDept: { type: String, required: [true, 'College and department is required'], trim: true, maxlength: 200 },
    degree: { type: String, required: [true, 'Degree is required'], trim: true, maxlength: 100 },
    yearOfStudy: { type: String, enum: ['1', '2', '3', '4', 'other'], required: [true, 'Year of study is required'] },
    fieldOfStudy: { type: String, required: [true, 'Field of study is required'], trim: true, maxlength: 100 },
    whyVolunteer: { type: String, required: [true, 'Please explain why you want to volunteer'], trim: true, maxlength: 1000 },
    motivation: { type: String, required: [true, 'Please share your motivation'], trim: true, maxlength: 1000 },
    experienceTypes: { type: [String], enum: ['Counseling', 'Peer support', 'Volunteering', 'Psychology related training'], default: [] },
    experienceDescription: { type: String, default: '', trim: true, maxlength: 500 },
    qualities: { type: [String], enum: ['Good Listener', 'Empathetic', 'Non-judgmental', 'Patient', 'Communication Skills'], default: [] },
    hoursPerWeek: { type: Number, required: [true, 'Please specify weekly availability'], min: [1, 'Must volunteer at least 1 hour per week'], max: [168, 'Invalid hours value'] },
    preferredTime: { type: [String], enum: ['Morning', 'Afternoon', 'Evening', 'Late Night'], default: [] },
    attendedWorkshops: { type: String, enum: ['yes', 'no'], required: [true, 'Please indicate workshop attendance'] },
    understandsRole: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must acknowledge that volunteers cannot replace therapists' } },
    willingToEscalate: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must be willing to escalate serious cases' } },
    agreesToConfidentiality: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must agree to maintain user confidentiality' } },
    treatsWithRespect: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must agree to treat users respectfully' } },
    understandsGuidelines: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must acknowledge understanding of Vyannaid guidelines' } },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    adminNotes: { type: String, default: '', maxlength: 500 }
  },
  { timestamps: true }
);

volunteerApplicationSchema.index({ userId: 1, status: 1 });
module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);
