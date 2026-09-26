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

let loginIsLoading = false;

function updateLoginButtonState() {
    if (!loginSubmitButton) {
        return;
    }

    const nik =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    const canSubmit =
        Boolean(nik) &&
        Boolean(password) &&
        navigator.onLine !== false &&
        !loginIsLoading;

    loginSubmitButton.disabled =
        !canSubmit;

    loginSubmitButton.classList.toggle(
        "opacity-50",
        !canSubmit
    );

    loginSubmitButton.classList.toggle(
        "cursor-not-allowed",
        !canSubmit
    );
}

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

    const missingFeatures = [];

    if (
        typeof window.fetch !==
        "function"
    ) {
        missingFeatures.push(
            "Fetch API"
        );
    }

    if (
        typeof window.Promise !==
        "function"
    ) {
        missingFeatures.push(
            "Promise"
        );
    }

    if (
        typeof window.AbortController !==
        "function"
    ) {
        missingFeatures.push(
            "AbortController"
        );
    }

    if (
        typeof window.URLSearchParams !==
        "function"
    ) {
        missingFeatures.push(
            "URLSearchParams"
        );
    }

    if (
        !window.sessionStorage
    ) {
        missingFeatures.push(
            "Session Storage"
        );
    }

    if (
        missingFeatures.length
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

        browserCompatibilityTitle.textContent =
            "Browser mungkin tidak didukung";

        browserCompatibilityMessage.textContent =
            "Gunakan Google Chrome, Microsoft Edge, atau Firefox versi terbaru.";

        return;
    }

    const isOpera =
        /OPR\/|Opera Mini|Opera Mobi/i.test(
            userAgent
        );

    if (isOpera) {
        browserCompatibilityNotice.classList.remove(
            "hidden"
        );

        browserCompatibilityTitle.textContent =
            "Browser terdeteksi: Opera";

        browserCompatibilityMessage.textContent =
            "Aplikasi tetap dapat digunakan, tetapi Chrome atau Edge direkomendasikan untuk konsistensi tampilan.";
    }
}

checkBrowserCompatibility();

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

        if (!nik) {
            usernameInput.classList.add(
                "border-red-300",
                "bg-red-50"
            );

            usernameInput.setAttribute(
                "aria-invalid",
                "true"
            );

            showLoginMessage(
                "NIK wajib diisi."
            );

            usernameInput.focus();

            return;
        }

        if (!/^\d+$/.test(nik)) {
            usernameInput.classList.add(
                "border-red-300",
                "bg-red-50"
            );

            usernameInput.setAttribute(
                "aria-invalid",
                "true"
            );

            showLoginMessage(
                "NIK hanya boleh berisi angka."
            );

            usernameInput.focus();

            return;
        }

        if (!password) {
            showLoginMessage(
                "Password wajib diisi."
            );

            passwordInput.focus();

            return;
        }

        usernameInput.classList.remove(
            "border-red-300",
            "bg-red-50"
        );

        usernameInput.removeAttribute(
            "aria-invalid"
        );

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

            this.setAttribute(
                "aria-label",
                passwordHidden
                    ? "Sembunyikan password"
                    : "Tampilkan password"
            );

            this.setAttribute(
                "aria-pressed",
                String(passwordHidden)
            );

            const icon =
                document.getElementById(
                    "togglePasswordIcon"
                );

            if (icon) {
                icon.innerHTML =
                    passwordHidden
                        ? `
                            <path d="M3 3l18 18"/>
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                            <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.1 3.8"/>
                            <path d="M6.1 6.1C3.4 8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 3-.4"/>
                        `
                        : `
                            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/>
                            <circle cx="12" cy="12" r="2.5"/>
                        `;
            }
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

        this.classList.remove(
            "border-red-300",
            "bg-red-50"
        );

        this.removeAttribute(
            "aria-invalid"
        );

        hideLoginMessage();
        updateLoginButtonState();
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

const loginReason =
    new URLSearchParams(
        window.location.search
    ).get(
        "reason"
    );

if (
    loginReason ===
    "session-expired"
) {
    showLoginMessage(
        "Sesi login Anda telah berakhir. Silakan login kembali."
    );

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
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
        this.value =
            this.value.replace(
                /\D/g,
                ""
            );

        hideLoginMessage();
        updateLoginButtonState();
    }
);

passwordInput.addEventListener(
    "input",
    function () {
        hideLoginMessage();
        updateLoginButtonState();
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
    if (!navigator.onLine) {
        return "Tidak ada koneksi internet. Periksa jaringan Anda lalu coba kembali.";
    }

    const rawMessage =
        typeof error === "string"
            ? error
            : String(
                error?.message ||
                ""
            ).trim();

    const message =
        rawMessage.toLowerCase();

    if (
        message.includes(
            "failed to fetch"
        ) ||
        message.includes(
            "network"
        ) ||
        message.includes(
            "fetch"
        )
    ) {
        return "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.";
    }

    if (
        message.includes(
            "timeout"
        ) ||
        message.includes(
            "terlalu lama"
        ) ||
        message.includes(
            "abort"
        )
    ) {
        return "Server terlalu lama merespons. Silakan coba kembali.";
    }

    if (
        /http\s+5\d\d/.test(
            message
        )
    ) {
        return "Server sedang mengalami gangguan. Silakan coba beberapa saat lagi.";
    }

    if (
        message.includes(
            "unauthorized"
        ) ||
        message.includes(
            "http 401"
        )
    ) {
        return "NIK atau password tidak valid.";
    }

    if (
        message.includes(
            "nonaktif"
        ) ||
        message.includes(
            "password"
        ) ||
        message.includes(
            "nik atau"
        ) ||
        message.includes(
            "akun"
        )
    ) {
        return rawMessage;
    }

    return "Login tidak dapat diproses. Silakan coba kembali.";
}