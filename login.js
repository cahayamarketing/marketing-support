"use strict";

/*
|--------------------------------------------------------------------------
| ELEMENT
|--------------------------------------------------------------------------
*/

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const capsLockHint =
    document.getElementById(
        "capsLockHint"
    );

const togglePasswordButton =
    document.getElementById(
        "togglePassword"
    );

const loginSubmitButton =
    document.getElementById(
        "loginSubmitButton"
    );

if (
    usernameInput &&
    window.matchMedia(
        "(min-width: 768px)"
    ).matches
) {
    window.setTimeout(
        function () {
            usernameInput.focus();
        },
        150
    );
}

const browserCompatibilityNotice =
    document.getElementById(
        "browserCompatibilityNotice"
    );

const browserCompatibilityTitle =
    document.getElementById(
        "browserCompatibilityTitle"
    );

const browserCompatibilityMessage =
    document.getElementById(
        "browserCompatibilityMessage"
    );    

function checkBrowserCompatibility() {

    if (
        !browserCompatibilityNotice
    ) {
        return;
    }

    const userAgent =
        navigator.userAgent || "";

    const unsupportedFeatures = [];

    if (
        typeof window.fetch !==
        "function"
    ) {
        unsupportedFeatures.push(
            "Fetch API"
        );
    }

    if (
        typeof window.Promise !==
        "function"
    ) {
        unsupportedFeatures.push(
            "Promise"
        );
    }

    if (
        typeof window.AbortController !==
        "function"
    ) {
        unsupportedFeatures.push(
            "AbortController"
        );
    }

    if (
        typeof window.URLSearchParams !==
        "function"
    ) {
        unsupportedFeatures.push(
            "URLSearchParams"
        );
    }

    if (
        !window.sessionStorage
    ) {
        unsupportedFeatures.push(
            "Session Storage"
        );
    }

    if (
        unsupportedFeatures.length
    ) {
        browserCompatibilityNotice.classList.remove(
            "hidden"
        );

        browserCompatibilityNotice.classList.remove(
            "border-amber-200",
            "bg-amber-50"
        );

        browserCompatibilityNotice.classList.add(
            "border-red-200",
            "bg-red-50"
        );

        browserCompatibilityTitle.className =
            "text-xs font-black text-red-800";

        browserCompatibilityMessage.className =
            "mt-1 text-xs leading-5 text-red-700";

        browserCompatibilityTitle.textContent =
            "Browser tidak mendukung fitur yang dibutuhkan";

        browserCompatibilityMessage.textContent =
            "Gunakan Google Chrome, Microsoft Edge, atau Firefox versi terbaru.";

        return;
    }

    const isOpera =
        /OPR\/|Opera Mini|Opera Mobi/i.test(
            userAgent
        );

    if (
        isOpera
    ) {
        browserCompatibilityNotice.classList.remove(
            "hidden"
        );

        browserCompatibilityTitle.textContent =
            "Browser terdeteksi: Opera";

        browserCompatibilityMessage.textContent =
            "Aplikasi tetap dapat digunakan, tetapi Google Chrome atau Microsoft Edge direkomendasikan untuk konsistensi tampilan dan perilaku sistem.";
    }
}

const loginTransition =
    document.getElementById(
        "loginTransition"
    );

const loginTransitionMessage =
    document.getElementById(
        "loginTransitionMessage"
    );


/*
|--------------------------------------------------------------------------
| CEK SESSION
|--------------------------------------------------------------------------
*/

const existingToken =
    sessionStorage.getItem(
        "sessionToken"
    );

const existingUser =
    sessionStorage.getItem(
        "currentUser"
    );

if (
    existingToken &&
    existingUser
) {
    window.location.replace(
        "index.html"
    );
}


/*
|--------------------------------------------------------------------------
| PROSES LOGIN
|--------------------------------------------------------------------------
*/

loginForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        if (
            navigator.onLine === false
        ) {
            showLoginMessage(
                "Tidak ada koneksi internet. Periksa koneksi jaringan Anda lalu coba kembali."
            );

            return;
        }        

        const nik =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        hideLoginMessage();

        if (!nik || !password) {
            showLoginMessage(
                "NIK dan password wajib diisi."
            );

            return;
        }

        setLoginLoading(true);

        try {
            const result =
                await loginWithRetry(
                    {
                        nik: nik,
                        password: password
                    }
                );

            setLoginLoading(
                true,
                "Login berhasil..."
            );

            sessionStorage.setItem(
                "sessionToken",
                result.token
            );

            sessionStorage.setItem(
                "currentUser",
                JSON.stringify(
                    result.user
                )
            );

            showLoginTransition(
                "Menyiapkan dashboard..."
            );

            window.location.replace(
                "index.html"
            );
            
        } catch (error) {
            showLoginMessage(
                getApiErrorMessage(error)
            );

            setLoginLoading(false);
        }
    }
);


/*
|--------------------------------------------------------------------------
| TAMPILKAN PASSWORD
|--------------------------------------------------------------------------
*/

if (togglePasswordButton) {
    togglePasswordButton.addEventListener(
        "click",
        function () {
            const passwordHidden =
                passwordInput.type ===
                "password";

            passwordInput.type =
                passwordHidden
                    ? "text"
                    : "password";

            this.textContent =
                passwordHidden
                    ? "Tutup"
                    : "Lihat";
        }
    );
}

usernameInput.addEventListener(
    "input",
    function () {
        this.value =
            this.value.replace(
                /\D/g,
                ""
            );
    }
);

function updateCapsLockHint(
    event
) {
    if (!capsLockHint) {
        return;
    }

    const capsLockActive =
        event.getModifierState &&
        event.getModifierState(
            "CapsLock"
        );

    capsLockHint.classList.toggle(
        "hidden",
        !capsLockActive
    );
}

passwordInput.addEventListener(
    "keydown",
    updateCapsLockHint
);

passwordInput.addEventListener(
    "keyup",
    updateCapsLockHint
);


function waitLoginRetry(milliseconds) {
    return new Promise(function (resolve) {
        window.setTimeout(
            resolve,
            milliseconds
        );
    });
}


async function loginWithRetry(
    payload,
    maximumAttempt = 3
) {
    let lastError = null;

    for (
        let attempt = 1;
        attempt <= maximumAttempt;
        attempt += 1
    ) {
        try {
            return await callApi(
                "login",
                payload
            );
        } catch (error) {
            lastError = error;

            const message =
                String(
                    error.message || ""
                ).toLowerCase();

            /*
            | Jangan retry jika memang data login salah.
            */

            const permanentError =
                message.includes("password") ||
                message.includes("nik atau") ||
                message.includes("nonaktif");

            if (
                permanentError ||
                attempt === maximumAttempt
            ) {
                throw error;
            }

            setLoginLoading(
                true,
                `Menghubungkan ulang (${attempt}/${maximumAttempt})...`
            );

            await waitLoginRetry(
                attempt * 1200
            );
        }
    }

    throw lastError;
}


document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key === "Escape" &&
            forgotModal &&
            !forgotModal.classList.contains(
                "hidden"
            )
        ) {
            closeForgotModal();
        }
    }
);


if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            const nik =
                document
                    .getElementById(
                        "forgotUsername"
                    )
                    .value
                    .trim();

            forgotMessage.classList.remove(
                "hidden"
            );

            if (!nik) {
                forgotMessage.className =
                    "mt-3 text-sm font-bold text-red-600";

                forgotMessage.textContent =
                    "Masukkan NIK terlebih dahulu.";

                return;
            }

            /*
            | Tidak memberitahukan apakah NIK ada atau
            | tidak demi keamanan akun.
            */

            forgotMessage.className =
                "mt-3 text-sm font-bold text-emerald-600";

            forgotMessage.textContent =
                "Silakan hubungi administrator untuk reset password.";
        }
    );
}


/*
|--------------------------------------------------------------------------
| FUNCTION UI
|--------------------------------------------------------------------------
*/

function showLoginMessage(message) {
    loginMessage.textContent =
        message;

    loginMessage.classList.remove(
        "hidden"
    );
}


function hideLoginMessage() {
    loginMessage.textContent = "";

    loginMessage.classList.add(
        "hidden"
    );
}

window.addEventListener(
    "offline",
    function () {
        showLoginMessage(
            "Koneksi internet terputus. Periksa jaringan Anda."
        );
    }
);

usernameInput.addEventListener(
    "input",
    function () {
        hideLoginMessage();
    }
);

passwordInput.addEventListener(
    "input",
    function () {
        hideLoginMessage();
    }
);

window.addEventListener(
    "online",
    function () {
        hideLoginMessage();
    }
);



function setLoginLoading(
    isLoading,
    message = "Memeriksa akun..."
) {
    if (isLoading) {
        loginSubmitButton.disabled = true;

        loginSubmitButton.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <span class="ui-spinner"></span>
                <span>${message}</span>
            </span>
        `;

        loginSubmitButton.classList.add(
            "cursor-wait",
            "opacity-90"
        );

        return;
    }

    loginSubmitButton.disabled = false;
    loginSubmitButton.innerHTML =
        "<span>Masuk</span>";

    loginSubmitButton.classList.remove(
        "cursor-wait",
        "opacity-90"
    );
}

function showLoginTransition(
    message = "Menyiapkan dashboard..."
) {
    if (
        !loginTransition
    ) {
        return;
    }

    if (
        loginTransitionMessage
    ) {
        loginTransitionMessage.textContent =
            message;
    }

    loginTransition.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";
}

/*
|--------------------------------------------------------------------------
| REQUEST KE BACKEND
|--------------------------------------------------------------------------
*/

async function callApi(
    action,
    payload = {}
) {
    const controller =
        new AbortController();

    /*
    | Hentikan request apabila backend tidak merespons
    | dalam waktu 25 detik.
    */

    const timeoutId =
        window.setTimeout(
            function () {
                controller.abort();
            },
            45000
        );

    try {
        const response =
            await fetch(
                "/api/gas",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        action: action,
                        payload: payload
                    }),

                    signal:
                        controller.signal,

                    cache: "no-store"
                }
            );

        const responseText =
            await response.text();

        if (!responseText.trim()) {
            throw new Error(
                "Server tidak memberikan respons."
            );
        }

        let data;

        try {
            data = JSON.parse(
                responseText
            );
        } catch (error) {
            console.error(
                "Respons login bukan JSON:",
                {
                    status:
                        response.status,

                    response:
                        responseText.slice(
                            0,
                            500
                        )
                }
            );

            throw new Error(
                "Respons backend tidak valid."
            );
        }

        if (
            !response.ok ||
            data.success === false
        ) {
            throw new Error(
                data.message ||
                data.error?.message ||
                (
                    typeof data.error ===
                    "string"
                        ? data.error
                        : ""
                ) ||
                `Login gagal. HTTP ${response.status}.`
            );
        }

        /*
        | Format dari Apps Script:
        | {
        |     success: true,
        |     result: {
        |         token: "...",
        |         user: {...}
        |     }
        | }
        */

        if (
            data.success === true &&
            Object.prototype.hasOwnProperty.call(
                data,
                "result"
            )
        ) {
            return data.result;
        }

        return data;
    } catch (error) {
        if (
            error.name ===
            "AbortError"
        ) {
            throw new Error(
                "Server terlalu lama merespons. Silakan coba masuk kembali."
            );
        }

        throw error;
    } finally {
        window.clearTimeout(
            timeoutId
        );
    }
}


/*
|--------------------------------------------------------------------------
| AMBIL PESAN ERROR
|--------------------------------------------------------------------------
*/

function getApiErrorMessage(error) {
    if (!error) {
        return "Terjadi kesalahan saat login.";
    }

    if (
        typeof error === "string"
    ) {
        return error;
    }

    return (
        error.message ||
        "Terjadi kesalahan saat login."
    );
}