"use strict";

/*
|--------------------------------------------------------------------------
| DATA USER DEMO
|--------------------------------------------------------------------------
| Ini masih simulasi frontend.
| Setelah backend dibuat, data user akan diambil dari API.
*/

const demoUsers = [
    {
        username: "crm.caruban",
        password: "12345",
        name: "CRM Caruban",
        branch: "CRB",
        branchName: "CARUBAN",
        role: "CRM",
        status: "AKTIF"
    },
    {
        username: "kacab.caruban",
        password: "12345",
        name: "Kepala Cabang Caruban",
        branch: "CRB",
        branchName: "CARUBAN",
        role: "KACAB",
        status: "AKTIF"
    },
    {
        username: "mscm",
        password: "12345",
        name: "Marketing Support",
        branch: "ALL",
        branchName: "SEMUA CABANG",
        role: "MSCM",
        status: "AKTIF"
    },
    {
        username: "manager",
        password: "12345",
        name: "Manager",
        branch: "ALL",
        branchName: "SEMUA CABANG",
        role: "MGR",
        status: "AKTIF"
    }
];

/*
|--------------------------------------------------------------------------
| ELEMENT
|--------------------------------------------------------------------------
*/

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const forgotModal = document.getElementById("forgotPasswordModal");
const forgotMessage = document.getElementById("forgotMessage");

/*
|--------------------------------------------------------------------------
| CEK SESSION
|--------------------------------------------------------------------------
| Jika sudah login, user tidak perlu melihat halaman login lagi.
*/

const existingSession = sessionStorage.getItem("currentUser");

if (existingSession) {
    window.location.replace("index.html");
}

/*
|--------------------------------------------------------------------------
| PROSES LOGIN
|--------------------------------------------------------------------------
*/

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    hideLoginMessage();

    const user = demoUsers.find(function (item) {
        return (
            item.username.toLowerCase() === username &&
            item.password === password
        );
    });

    if (!user) {
        showLoginMessage("Username atau password tidak sesuai.");
        return;
    }

    if (user.status !== "AKTIF") {
        showLoginMessage(
            "Akun ini berstatus nonaktif. Hubungi administrator."
        );

        return;
    }

    /*
    |--------------------------------------------------------------------------
    | SIMPAN SESSION
    |--------------------------------------------------------------------------
    | Password sengaja tidak ikut disimpan.
    */

    const sessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        branch: user.branch,
        branchName: user.branchName,
        role: user.role,
        status: user.status
    };

    sessionStorage.setItem(
        "currentUser",
        JSON.stringify(sessionUser)
    );

    window.location.replace("index.html");
});

/*
|--------------------------------------------------------------------------
| TAMPILKAN PASSWORD
|--------------------------------------------------------------------------
*/

document
    .getElementById("togglePassword")
    .addEventListener("click", function () {
        const passwordHidden = passwordInput.type === "password";

        passwordInput.type = passwordHidden ? "text" : "password";

        this.textContent = passwordHidden ? "Tutup" : "Lihat";
    });

/*
|--------------------------------------------------------------------------
| MODAL LUPA PASSWORD
|--------------------------------------------------------------------------
*/

document
    .getElementById("forgotPasswordButton")
    .addEventListener("click", function () {
        forgotModal.classList.remove("hidden");

        document.getElementById("forgotUsername").focus();
    });

document
    .getElementById("closeForgotModal")
    .addEventListener("click", closeForgotModal);

forgotModal.addEventListener("click", function (event) {
    if (event.target === forgotModal) {
        closeForgotModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !forgotModal.classList.contains("hidden")
    ) {
        closeForgotModal();
    }
});

document
    .getElementById("forgotPasswordForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document
            .getElementById("forgotUsername")
            .value
            .trim()
            .toLowerCase();

        const user = demoUsers.find(function (item) {
            return item.username.toLowerCase() === username;
        });

        forgotMessage.classList.remove("hidden");

        if (!user) {
            forgotMessage.className =
                "mt-3 text-sm font-bold text-red-600";

            forgotMessage.textContent =
                "Username tidak ditemukan.";

            return;
        }

        if (user.status !== "AKTIF") {
            forgotMessage.className =
                "mt-3 text-sm font-bold text-amber-600";

            forgotMessage.textContent =
                "Akun berstatus nonaktif. Hubungi administrator.";

            return;
        }

        forgotMessage.className =
            "mt-3 text-sm font-bold text-emerald-600";

        forgotMessage.textContent =
            "Permintaan reset berhasil dibuat. Hubungi administrator.";
    });

/*
|--------------------------------------------------------------------------
| FUNCTION
|--------------------------------------------------------------------------
*/

function showLoginMessage(message) {
    loginMessage.textContent = message;
    loginMessage.classList.remove("hidden");
}

function hideLoginMessage() {
    loginMessage.textContent = "";
    loginMessage.classList.add("hidden");
}

function closeForgotModal() {
    forgotModal.classList.add("hidden");

    document.getElementById("forgotPasswordForm").reset();

    forgotMessage.textContent = "";
    forgotMessage.classList.add("hidden");
}