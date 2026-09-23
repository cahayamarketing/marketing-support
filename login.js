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

const togglePasswordButton =
    document.getElementById(
        "togglePassword"
    );

const forgotModal =
    document.getElementById(
        "forgotPasswordModal"
    );

const forgotMessage =
    document.getElementById(
        "forgotMessage"
    );

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

const closeForgotModalButton =
    document.getElementById(
        "closeForgotModal"
    );

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );

const loginSubmitButton =
    document.getElementById(
        "loginSubmitButton"
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
                "Menyiapkan dashboard..."
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


/*
|--------------------------------------------------------------------------
| MODAL LUPA PASSWORD
|--------------------------------------------------------------------------
*/

if (
    forgotPasswordButton &&
    forgotModal
) {
    forgotPasswordButton.addEventListener(
        "click",
        function () {
            forgotModal.classList.remove(
                "hidden"
            );

            const forgotUsername =
                document.getElementById(
                    "forgotUsername"
                );

            if (forgotUsername) {
                forgotUsername.focus();
            }
        }
    );
}


if (closeForgotModalButton) {
    closeForgotModalButton.addEventListener(
        "click",
        closeForgotModal
    );
}


if (forgotModal) {
    forgotModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                forgotModal
            ) {
                closeForgotModal();
            }
        }
    );
}

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


function closeForgotModal() {
    if (!forgotModal) {
        return;
    }

    forgotModal.classList.add(
        "hidden"
    );

    if (forgotPasswordForm) {
        forgotPasswordForm.reset();
    }

    if (forgotMessage) {
        forgotMessage.textContent = "";

        forgotMessage.classList.add(
            "hidden"
        );
    }
}

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