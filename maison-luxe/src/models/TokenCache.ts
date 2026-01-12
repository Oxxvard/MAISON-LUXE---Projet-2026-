import mongoose, { Schema, Model } from 'mongoose';

export interface ITokenCache {
  service: string;
  token: string;
  expiry: number;
  createdAt: Date;
  updatedAt: Date;
}

const TokenCacheSchema = new Schema<ITokenCache>(
  {
    service: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiry: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index TTL pour supprimer automatiquement les tokens expirés après 48h
TokenCacheSchema.index({ expiry: 1 }, { expireAfterSeconds: 172800 }); // 48h

const TokenCache: Model<ITokenCache> =
  mongoose.models.TokenCache || mongoose.model<ITokenCache>('TokenCache', TokenCacheSchema);

export default TokenCache;
