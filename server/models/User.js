import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  street: String, city: String, state: String, zip: String, country: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  address: AddressSchema
});

export default mongoose.model('User', UserSchema);
