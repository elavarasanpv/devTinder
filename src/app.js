/** @format */
require("dotenv").config();
const express = require("express");
const connectBD = require("./config/database");
const User = require("./models/user");
const axios = require("axios");
const app = express();
const { validateSignupData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(cookieParser());

const { userAuth } = require("./middlewares/auth");

// app.use("/admin", adminAuth);

// app.get("/admin/getAllData", (req, res) => {
//   res.send("Admin data");
// });

// app.get("/admin/deleteData", (req, res) => {
//   res.send("Delete data Admin data");
// });

// app.get("/user", userAuth, (req, res) => {
//   res.send("User data");
// });

// app.post("/user/login", (req, res) => {
//   res.send("User logged in");
// });

// app.get("/getUser", (req, res) => {
//   throw new Error("Something went wrong!");
//   res.send("Get User data");
// });

app.post("/signup", async (req, res) => {
  console.log("Signup request body:", req.body);

  const { firstname, lastname, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);
  console.log("Hashed password:", passwordHash);

  const user = new User({
    firstname,
    lastname,
    email,
    password: passwordHash,
  });

  //encrpt password before saving (to be implemented)

  try {
    validateSignupData(req);
    await user.save();
    res.send("User signed up successfully");
  } catch (error) {
    return res.status(500).send("Error signing up user: " + error.message);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid email or password");
    }

    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid email or password");
    } else {
      const token = await user.getJWT();
      res.cookie("token", token);
      res.send("User logged in successfully");
    }
  } catch (error) {
    return res.status(500).send("Error logging in user: " + error.message);
  }
});

app.get("/profile", userAuth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

app.post("/sendConnectionRequest", userAuth, async (req, res) => {
  const user = req.user;
  res.send(`Connection request sent by ${user.firstname}`);
});

// const API_KEY = process.env.GEMINI_API_KEY;
// const MODEL = process.env.GEMINI_MODEL;
// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// app.post("/ask", async (req, res) => {
//   try {
//     const question = `
// Give me 10 tips to improve my coding skills as a developer.

// Rules:
// - Each tip must be explained in 3–4 sentences
// - Use numbered bullet points
// - Give practical examples
// `;

//     const response = await axios.post(GEMINI_URL, {
//       contents: [
//         {
//           parts: [{ text: question }],
//         },
//       ],
//       generationConfig: {
//         temperature: 0.7,
//         maxOutputTokens: 500,
//         topP: 0.95,
//       },
//     });

//     const answer =
//       response.data?.candidates?.[0]?.content?.parts
//         ?.map((p) => p.text)
//         .join("") || "No response";

//     res.json({
//       success: true,
//       answer,
//     });
//   } catch (err) {
//     console.error("GEMINI ERROR:", err.response?.data || err.message);
//     res.status(500).json({
//       success: false,
//       error: "Gemini API failed",
//       message: err.response?.data?.error?.message || err.message,
//     });
//   }
// });

// const HF_MODEL = "google/flan-t5-base";
// const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

// app.post("/question", async (req, res) => {
//   try {
//     const question = "What is Newton's second law?";

//     const response = await axios.post(
//       HF_URL,
//       {
//         inputs: question,
//         parameters: {
//           max_new_tokens: 200,
//           temperature: 0.4,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.HF_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 30000,
//       },
//     );

//     console.log("HF RAW RESPONSE:", response.data);

//     // ✅ Handle all HF response formats
//     if (Array.isArray(response.data)) {
//       return res.json({
//         success: true,
//         answer: response.data[0]?.generated_text || "",
//       });
//     }

//     // Model loading / error case
//     if (response.data.error) {
//       return res.status(503).json({
//         success: false,
//         error: response.data.error,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Unexpected HF response format",
//       data: response.data,
//     });
//   } catch (error) {
//     console.error("HF ERROR FULL:", error.response?.data || error.message);

//     res.status(500).json({
//       success: false,
//       error: "AI service failed",
//       details: error.response?.data || error.message,
//     });
//   }
// });

//get user feed
app.get("/user", async (req, res) => {
  const id = req.body.id;
  console.log("ID received:", id);
  try {
    if (!id) {
      return res.status(400).send("ID query parameter is required");
    }
    const user = await User.findById(id);
    if (!user || user.length === 0) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

app.get("/feed", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

app.delete("/user/:id", async (req, res) => {
  const id = req.params.id;
  console.log("ID to delete:", id);
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User deleted successfully");
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

app.patch("/user/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const Updated_Allowed_Fields = [
      "age",
      "about",
      "photoUrl",
      "skills",
      "password",
    ];

    const checkUpdates = Object.keys(data).every((field) =>
      Updated_Allowed_Fields.includes(field),
    );

    if (!checkUpdates) {
      return res.status(400).send("Invalid update fields");
    }
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.json(updatedUser);
  } catch (err) {
    return res.status(500).send("Server error: " + err.message);
  }
});

connectBD()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });
