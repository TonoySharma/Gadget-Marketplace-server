import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const client = new MongoClient(process.env.MONGODB_URI as string);
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});



export async function connectToMongoDB() {
  try {
    const db = client.db("gadgets_hub");

    const productsCollection = db.collection("all-products");
    const usersCollection = db.collection("users");
    const cartCollection = db.collection("carts");



    // Browse/Add Gadgets API
    app.post("/api/all-products", async (req: Request, res: Response) => {
      try {
        const productsData = req.body;

        const result = await productsCollection.insertMany(productsData);

        res.status(201).json({
          success: true,
          message: "Products added successfully!",
          data: result
        });
      } catch (error) {
        console.error("Error inserting products:", error);
        res.status(500).json({
          success: false,
          message: "Failed to add products",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Product Details API
    app.get("/api/products/:id", async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (Array.isArray(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid product id",
          });
        }

        const query = {
          _id: new ObjectId(id),
        };

        const result = await productsCollection.findOne(query);

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        res.status(200).json({
          success: true,
          data: result,
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch product details",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Featured Products API
    app.get("/api/featured-products", async (req: Request, res: Response) => {
      try {
        const products = await productsCollection
          .find()
          .limit(8)
          .toArray();

        res.status(200).json({
          success: true,
          data: products,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch featured products",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // search API
    app.get("/api/all-products", async (req: Request, res: Response) => {
      // console.log("REQ QUERY:", req.query);
      try {
        const {
          page = "1",
          limit = "10",
          search = "",
          category = "",
          minPrice = "",
          maxPrice = "",
          sort = "",
        } = req.query;

        // console.log(req.query);

        const skip = (Number(page) - 1) * Number(limit);

        const query: any = {};

        // Search
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
          ];
        }

        // Filter by Category
        if (category && category !== "All") {
          query.category = category;
        }

        // Filter by Price
        if (minPrice || maxPrice) {
          query.price = {};

          if (minPrice) {
            query.price.$gte = Number(minPrice);
          }

          if (maxPrice) {
            query.price.$lte = Number(maxPrice);
          }
        }

        // Sorting
        let sortOption: any = { createdAt: -1 };

        switch (sort) {
          case "price-asc":
            sortOption = { price: 1 };
            break;

          case "price-desc":
            sortOption = { price: -1 };
            break;

          case "rating-desc":
            sortOption = { rating: -1 };
            break;

          case "latest":
            sortOption = { createdAt: -1 };
            break;
        }

        const totalProducts = await productsCollection.countDocuments(query);

        const products = await productsCollection
          .find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(Number(limit))
          .toArray();

        res.status(200).json({
          success: true,
          data: products,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalProducts,
            totalPages: Math.ceil(totalProducts / Number(limit)),
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch products",
        });
      }
    });

    // Add product API
    app.post("/api/add-products", async (req: Request, res: Response) => {
      try {
        const product = req.body;

        const result = await productsCollection.insertOne({...product,
          createdAt: new Date(),});

        res.status(201).json({
          success: true,
          message: "Product added successfully",
          insertedId: result.insertedId,
        });

      } catch (error) {
        console.error(error);

        res.status(500).json({
          success: false,
          message: "Failed to add product",
          
        });
      }
    });















    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

export async function disconnectFromMongoDB() {
  // await client.close();
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectToMongoDB();
});