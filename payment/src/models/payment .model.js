const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }
  },
  { timestamps: true },
);

const paymentModel = mongoose.model("Payment", paymentSchema);

module.exports = paymentModel;
