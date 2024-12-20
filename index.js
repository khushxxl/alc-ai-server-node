const express = require("express");
const { OpenAI } = require("openai");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 8001; // Allow Heroku to set the port

// Configure CORS with specific options
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow specific methods
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" })); // Need to enable JSON parsing with increased limit for base64
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Also increase urlencoded limit

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

app.post("/analyze-image", async (req, res) => {
  console.log("Request received");
  const { base64Image } = req.body;

  if (!base64Image) {
    console.log("No image data provided");
    return res.status(400).json({ error: "No image data provided" });
  }

  try {
    // Validate base64 string format
    if (!base64Image.startsWith("data:image")) {
      throw new Error(
        "Invalid image format. Must be base64 encoded with data URI scheme"
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `What's in this image? - Explain to me about this alcoholic beverage and return as a json object start with
              
 {
    "type": "Whiskey",
    "category": "Single Malt",
    "brand": "Glenfiddich",
    "price": {
      "currency": "USD",
      "amount": 60
    },
    "flavor_profile": {
      "sweetness": 3,
      "aroma": ["Fruity", "Floral"],
      "smoothness": 4,
      "notes": ["Vanilla", "Oak", "Honey"]
    },
    "alcohol_content": {
      "abv": 40,
      "unit": "%"
    },
    "production": {
      "age": 12,
      "distillation": "Triple Distilled",
      "barrel_type": "Ex-Bourbon Oak",
      "country_of_origin": "Scotland"
    },
    "dietary_info": {
      "calories_per_serving": 70,
      "gluten_free": true
    },
    "packaging": {
      "bottle_size": 750,
      "unit": "ml",
      "design": "Premium",
      "gift_packaging": false
    },
    "occasion": "Special Event",
    "pairing_options": ["Cheese", "Dark Chocolate", "Grilled Meat"],
    "reviews": {
      "average_rating": 4.7,
      "critic_reviews": ["Highly Recommended by Whisky Advocate"],
      "user_reviews": 350
    }
  }
    just give me these fields and nothing else, dont add any other fields or comments or anything else, just the json object
    i need my data to be in json format and i need to return the json object as a string exclude backticks in start well start and the response with {  } 
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log("Analysis complete");
    console.log(response.choices[0].message.content);

    // Set appropriate headers
    res.setHeader("Content-Type", "application/json");
    res
      .status(200)
      .json({ result: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something broke!",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
