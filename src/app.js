/** @format */
require("dotenv").config();
const express = require("express");
const connectBD = require("./config/database");
const User = require("./models/user");
const axios = require("axios");
const app = express();

app.use(express.json());

// const { adminAuth, userAuth } = require("./middlewares/auth");

// app.get("/user/:userId", (req, res) => {
//   console.log(req.params);
//   res.send({ name: "Elavarasan", age: 26 });
// });

// app.get("/abc", (req, res) => {
//   res.send({ name: "Elavarasan", age: 26 });
// });

// app.post("/user", async (req, res) => {
//   console.log("User Created");
//   res.send("User created");
// });

// app.use("/test", (req, res, next) => {
//   // res.send("test route");
//   next();
// });
// app.use("/test", (req, res) => {
//   res.send("second route");
// });

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

// app.use("/", (err, req, res, next) => {
//   console.error(err);
//   res.status(500).send("Something broke!");
// });

app.post("/signup", async (req, res) => {
  console.log("Signup request body:", req.body);
  const userObj = req.body;

  const user = new User(userObj);
  try {
    await user.save();
    res.send("User signed up successfully");
  } catch (error) {
    return res.status(500).send("Error signing up user: " + error.message);
  }
});

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

app.post("/ask", async (req, res) => {
  try {
    const question = `
Give me 10 tips to improve my coding skills as a developer.

Rules:
- Each tip must be explained in 3–4 sentences
- Use numbered bullet points
- Give practical examples
`;

    const response = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [{ text: question }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.95,
      },
    });

    const answer =
      response.data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") || "No response";

    res.json({
      success: true,
      answer,
    });
  } catch (err) {
    console.error("GEMINI ERROR:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: "Gemini API failed",
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

const HF_MODEL = "google/flan-t5-base";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

app.post("/question", async (req, res) => {
  try {
    const question = "What is Newton's second law?";

    const response = await axios.post(
      HF_URL,
      {
        inputs: question,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.4,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("HF RAW RESPONSE:", response.data);

    // ✅ Handle all HF response formats
    if (Array.isArray(response.data)) {
      return res.json({
        success: true,
        answer: response.data[0]?.generated_text || "",
      });
    }

    // Model loading / error case
    if (response.data.error) {
      return res.status(503).json({
        success: false,
        error: response.data.error,
      });
    }

    res.status(500).json({
      success: false,
      error: "Unexpected HF response format",
      data: response.data,
    });
  } catch (error) {
    console.error("HF ERROR FULL:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "AI service failed",
      details: error.response?.data || error.message,
    });
  }
});

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
    const Updated_Allowed_Fields = ["age", "about", "photoUrl", "skills"];

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
