const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
const { get } = require("mongoose");

async function registerUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      fullName: { firstName, lastName },
      role
    } = req.body;

    const isUserAlreadyRegistered = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyRegistered) {
      return res
        .status(409)
        .json({ message: "Username or email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = new userModel({
      username,
      email,
      password: hash,
      fullName: { firstName, lastName },
      role: role || "user"
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("registerUser error ", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// login
async function loginUser(req, res) {
  try {
    const { email, username, password } = req.body;

    if (!email && !username) {
      return res
        .status(400)
        .json({ message: "Email or username is required for login" });
    }

    const user = await userModel
      .findOne({
        $or: [{ email }, { username }],
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid username or email" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const tokenPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("loginUser error ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getCurrentUser(req, res) {
  return res.status(200).json({
    message: "Current user fetched successfully",
    user: req.user,
  });
}

// logout
async function logoutUser(req, res) {
  try {
    const token = req.cookies.token;

    if (token) {
      await redis.set(`blacklist_${token}`, true, "EX", 26 * 60 * 60);
    }

    // Blacklist the token in Redis

    // Set expiry to 26 hours to cover token validity and some buffer time

    // Clear the cookie
    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      maxAge: 0,
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("logoutUser error ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getUserAddresses(req, res) {
  const id = req.user.id;
  const user = await userModel.findById(id).select("address");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const addresses = user.address || [];

  if (addresses.length > 0) {
    let firstDefaultFound = false;

    for (const addr of addresses) {
      if (addr.isDefault) {
        if (!firstDefaultFound) {
          firstDefaultFound = true;
        } else {
          addr.isDefault = false;
        }
      }
    }

    if (!firstDefaultFound) {
      addresses[0].isDefault = true;
    }

    await user.save();
  }

  return res.status(200).json({ addresses });
}

async function addUserAddress(req, res) {
  try {
    const id = req.user.id;
    const { street, city, state, country, pincode, phone, isDefault } =
      req.body;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isDefault) {
      user.address.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.address.push({
      street,
      city,
      state,
      country,
      pincode,
      phone,
      isDefault: Boolean(isDefault),
    });

    await user.save();

    return res.status(201).json({ addresses: user.address });
  } catch (error) {
    console.log("addUserAddress error ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteUserAddress(req, res) {
  try {
    const id = req.user.id;
    const { addressId } = req.params;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalLength = user.address.length;
    user.address = user.address.filter(
      (addr) => addr._id.toString() !== addressId
    );

    if (user.address.length === originalLength) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Ensure default flag remains consistent: if no default, set first as default
    if (user.address.length > 0) {
      let hasDefault = user.address.some((addr) => addr.isDefault);
      if (!hasDefault) {
        user.address[0].isDefault = true;
      }
    }

    await user.save();

    return res.status(200).json({ addresses: user.address });
  } catch (error) {
    console.log("deleteUserAddress error ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
};
