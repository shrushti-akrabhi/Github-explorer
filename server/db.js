import mongoose from 'mongoose';

// One person who has signed in with GitHub. Upserted on every login.
const userSchema = new mongoose.Schema(
  {
    githubId: { type: Number, required: true, unique: true },
    login: { type: String, required: true },
    name: String,
    avatarUrl: String,
    htmlUrl: String,
    lastLoginAt: Date,
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// A repository a user saved. We keep a small snapshot so the Saved page needs no GitHub calls.
const savedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repoId: { type: Number, required: true },
    fullName: { type: String, required: true },
    name: String,
    description: String,
    htmlUrl: String,
    language: String,
    topics: [String],
    stars: Number,
    forks: Number,
    isFork: Boolean,
    repoUpdatedAt: Date,
  },
  { timestamps: { createdAt: 'savedAt', updatedAt: false } }
);
savedSchema.index({ userId: 1, repoId: 1 }, { unique: true }); // a repo can be saved once per user

export const User = mongoose.model('User', userSchema);
export const SavedRepo = mongoose.model('SavedRepo', savedSchema);

export const connectDb = (uri) => mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
