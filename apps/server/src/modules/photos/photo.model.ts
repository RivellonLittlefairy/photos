import mongoose, { Schema, model } from "mongoose";

const photoSchema = new Schema(
  {
    title: {
      type: String,
      required: false,
      default: "",
      maxlength: 60,
      trim: true
    },
    description: {
      type: String,
      default: undefined,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    contentHash: {
      type: String,
      default: undefined,
      trim: true,
      index: true,
      unique: true,
      sparse: true
    },
    capturedAt: {
      type: Date,
      required: true,
      index: true
    },
    stage: {
      type: String,
      default: undefined,
      index: true,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    privacy: {
      type: String,
      enum: ["private", "family"],
      default: "private",
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const PhotoModel = mongoose.models.Photo ?? model("Photo", photoSchema);
