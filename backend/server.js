const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const app = express();

app.use(cors());
app.use(express.json());

// 1. Koneksi MongoDB
mongoose.connect('mongodb+srv://Admin:12345@workspace.1hn74vf.mongodb.net/?appName=Workspace');

// 2. Schema Data
const bookSchema = new mongoose.Schema({
    userId: String,
    title: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
});

const Book = mongoose.model('Book', bookSchema);

// 3. Konfigurasi Cloudinary (Untuk Simpan File Gratis)
cloudinary.config({ 
  cloud_name: 'dcky4itki', 
  api_key: '287732471984783', 
  api_secret: 'Mq-zO5x2z4cg3w4iyuDL9SHJ8m4' 
});

// 4. Endpoint Upload
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { 
            resource_type: "auto",
            type: "upload",      // Memastikan tipe upload publik
            access_mode: "public" // Memastikan mode akses publik
        });
        
        const newBook = new Book({
            userId: req.body.userId,
            title: req.file.originalname,
            url: result.secure_url // Gunakan secure_url untuk HTTPS
        });

        await newBook.save();
        res.json(newBook);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 4. Endpoint Ambil Data
app.get('/api/books/:userId', async (req, res) => {
    try {
        // Book.find sekarang akan bekerja karena model sudah didefinisikan di atas
        const books = await Book.find({ userId: req.params.userId }).sort({ uploadDate: -1 });
        res.json(books); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk Menghapus Materi
app.delete('/api/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Materi berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server jalan di port 3000"));