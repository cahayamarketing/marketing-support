"use strict";



async function callApi(
    action,
    payload = {}
) {
    const token =
        sessionStorage.getItem(
            "sessionToken"
        ) || "";

    const response = await fetch(
        "/api/gas",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                action: action,
                token: token,
                payload: payload
            })
        }
    );

    let result;

    try {
        result =
            await response.json();
    } catch (error) {
        throw new Error(
            "Respons backend tidak valid."
        );
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Permintaan gagal diproses."
        );
    }

    return result;
}


function getApiErrorMessage(error) {
    if (!error) {
        return "Terjadi kesalahan.";
    }

    return (
        error.message ||
        String(error)
    ).replace(
        /^Exception:\s*/i,
        ""
    );
}