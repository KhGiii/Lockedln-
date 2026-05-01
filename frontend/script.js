import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBiliBfdE0sDHI3weYESCMXV-vZppHR-Fc",
    authDomain: "workspace-76489.firebaseapp.com",
    projectId: "workspace-76489",
    storageBucket: "workspace-76489.firebasestorage.app",
    messagingSenderId: "958477046057",
    appId: "1:958477046057:web:f50af0fcbfaca6a087e738"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();
// Tambahkan ini di bagian bawah script.js atau di dalam fungsi inisialisasi
const setBtn = document.getElementById('set-custom-btn');
if (setBtn) {
    setBtn.onclick = () => {
        const minInput = document.getElementById('custom-minutes');
        const mins = parseInt(minInput.value);
        
        if (mins > 0) {
            // Hentikan timer yang sedang berjalan
            clearInterval(timerInterval);
            isRunning = false;
            
            // Ubah waktu (menit ke detik)
            timeLeft = mins * 60;
            
            // Perbarui tampilan angka di layar
            updateDisplay(); 
            
            console.log("Timer diganti ke:", mins, "menit");
        } else {
            alert("Silakan masukkan angka menit!");
        }
    };
}

// --- STATE & TIMER (Sesuai Layout Header Baru) ---
let timerInterval;
let timeLeft = 25 * 60;
let isRunning = false;

window.setTimer = (minutes, mode) => {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = minutes * 60;
    updateDisplay();
    
    // Sesuaikan selector untuk tombol mode di header
    document.querySelectorAll('.pomodoro-modes-mini button').forEach(b => b.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
};

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('time-display').textContent = display;
}

document.getElementById('start-btn').onclick = () => {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            alert("Sesi selesai!");
        }
    }, 1000);
};

document.getElementById('pause-btn').onclick = () => {
    clearInterval(timerInterval);
    isRunning = false;
};

document.getElementById('reset-btn').onclick = () => {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = 25 * 60;
    updateDisplay();
};

// --- AUTH & SYNC ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('user-name').textContent = user.displayName;
        loadUserMaterials(user.uid);
    } else {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('user-profile').style.display = 'none';
        document.getElementById('bookshelf').innerHTML = "";
    }
});

document.getElementById('login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- RAK BUKU & UPLOAD (Sesuai Tombol Compact) ---
const fileUpload = document.getElementById('file-upload');

fileUpload.onchange = async (e) => {
    const user = auth.currentUser;
    if (!user) return alert("Silakan login dulu!");

    const file = e.target.files[0];
    if (!file) return;

    // Selector baru untuk area upload materi yang compact
    const uploadLabel = document.querySelector('.upload-label-compact');
    const originalContent = uploadLabel.innerHTML;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);

    try {
        // Visual Feedback
        uploadLabel.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mengunggah...`;
        uploadLabel.style.pointerEvents = "none";

        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            loadUserMaterials(user.uid); 
        } else {
            alert("Gagal upload ke server.");
        }
    } catch (err) {
        console.error("Detail Error:", error); // Ini akan menampilkan error asli
        alert("Server backend tidak merespons.");
    } finally {
        uploadLabel.innerHTML = originalContent;
        uploadLabel.style.pointerEvents = "auto";
        e.target.value = ""; 
    }
};

async function loadUserMaterials(uid) {
    try {
        const response = await fetch(`http://localhost:3000/api/books/${uid}`);
        const books = await response.json();
        
        const bookshelf = document.getElementById('bookshelf');
        bookshelf.innerHTML = "";
        
        books.forEach(data => {
            const bookWrapper = document.createElement('div');
            bookWrapper.className = 'book-wrapper';

            const book = document.createElement('div');
            book.className = 'book-item';
            // Berikan warna acak agar rak terlihat hidup
            book.style.backgroundColor = `hsl(${Math.random() * 360}, 60%, 35%)`;
            book.innerHTML = `<div class="book-title">${data.title.substring(0,12)}...</div>`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-book-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Hapus "${data.title}"?`)) {
                    await deleteBook(data._id, uid);
                }
            };

            book.onclick = () => {
                const modal = document.getElementById('book-modal');
                const viewer = document.getElementById('modal-viewer');
                viewer.src = data.url;
                modal.style.display = "block";
            };

            bookWrapper.appendChild(book);
            bookWrapper.appendChild(deleteBtn);
            bookshelf.appendChild(bookWrapper);
        });
    } catch (err) {
        console.error("Gagal memuat buku:", err);
    }
}

async function deleteBook(bookId, uid) {
    try {
        const response = await fetch(`http://localhost:3000/api/books/${bookId}`, {
            method: 'DELETE'
        });
        if (response.ok) loadUserMaterials(uid);
    } catch (err) {
        alert("Gagal menghapus file.");
    }
}

// Modal Close
document.querySelector('.close-modal').onclick = () => {
    document.getElementById('book-modal').style.display = "none";
    document.getElementById('modal-viewer').src = ""; // Stop PDF/Video saat ditutup
};

// --- ENVIRONMENT & MUSIK LOKAL ---
// Ganti Latar (Lokal)
document.getElementById('bg-upload').onchange = (e) => {
    if (e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        document.body.style.backgroundImage = `url('${url}')`;
    }
};

// Musik Lokal (Sesuai Selector Compact)
const audio = document.getElementById('bg-audio');
document.getElementById('music-upload').onchange = (e) => {
    if (e.target.files[0]) {
        audio.src = URL.createObjectURL(e.target.files[0]);
        audio.play();
    }
};

document.getElementById('stop-music-btn').onclick = () => {
    audio.pause();
    audio.currentTime = 0;
};


// Tambahkan fungsi ini di bagian atas atau dekat logika timer
window.setCustomTimer = () => {
    const minInput = document.getElementById('custom-minutes');
    const mins = parseInt(minInput.value);
    
    if (mins > 0) {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = mins * 60;
        updateDisplay();
        
        // Matikan semua status active pada tombol mode
        document.querySelectorAll('.pomodoro-modes-mini button').forEach(b => b.classList.remove('active'));
    } else {
        alert("Masukkan jumlah menit yang valid!");
    }
};

// Update bagian setInterval di dalam document.getElementById('start-btn').onclick
document.getElementById('start-btn').onclick = () => {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            
            // FITUR SUARA: Putar alarm saat waktu habis
            const alarm = document.getElementById('alarm-sound');
            alarm.play(); 
            
            alert("Sesi selesai!");
        }
    }, 1000);
};