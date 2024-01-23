const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello House portal server is running');
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mi7otul.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const db = client.db('house-portal');
        const houseCollection = db.collection('house');
        const userCollection = db.collection('user');


        app.get('/houses', async (req, res) => {
            const result = await houseCollection.find().toArray();
            res.send(result);
        });
        app.get('/houseView/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await houseCollection.findOne(query);
            res.send(result);
        });



        app.post('/register', async (req, res) => {
            try {
                const { fullName, email, password, role } = req.body;

                const user = await userCollection.findOne({ email: email });

                if (user) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
            

                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = {
                    fullName,
                    email,
                    password: hashedPassword,
                    role,
                    // Add additional fields as needed
                    verified: false, // For email verification
                };

                // Insert the new user into the user collection
                const result = await userCollection.insertOne(newUser);

                console.log(result)

                if (result.insertedId) {
                    res.status(201).json({ message: 'User registered successfully.' });
                } else {
                    res.status(500).json({ message: 'User registration failed' });
                }
            } catch (error) {
                if (error.code === 11000 || error.code === 11001) {
                    // Duplicate key error, email already exists
                    return res.status(400).json({ message: 'Email address already exists' });
                }

                console.error('Error during registration:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        app.post('/auth/login', async (req, res) => {
            // console.log(req.body)
            try {
                const { email, password } = req.body;

                const user = await userCollection.findOne({ email: email });
                

                const isPasswordValid = await bcrypt.compare(password, user.password);
                // console.log(isPasswordValid)

                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                res.status(201).send(user);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Hello House portal server is running on port${port}`);
});