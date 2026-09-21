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
                await callApi(
                    "login",
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