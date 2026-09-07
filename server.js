require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Neon PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Get all notes
app.get("/api/notes", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM notes ORDER BY created_at DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Unable to fetch notes"
        });
    }
});

// Add a new note
app.post("/api/notes", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: "Title and content are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO notes (title, content)
             VALUES ($1, $2)
             RETURNING *`,
            [title, content]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Unable to save note"
        });
    }
});

// Update a note
app.put("/api/notes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: "Title and content are required"
            });
        }

        const result = await pool.query(
            `UPDATE notes
             SET title = $1,
                 content = $2
             WHERE id = $3
             RETURNING *`,
            [title, content, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Note not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Unable to update note"
        });
    }
});

// Delete a note
app.delete("/api/notes/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM notes WHERE id = $1",
            [id]
        );

        res.json({
            message: "Note deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Unable to delete note"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});