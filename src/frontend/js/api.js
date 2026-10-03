"use strict";

async function callApi(
    action,
    payload = {}
) {
    const apiStartedAt =
        performance.now();

    const token =
        sessionStorage.getItem(
            "sessionToken"
        ) || "";

    // ==========================================
    // SUPABASE API
    // ==========================================

    if (action === "getPkmData") {

        const startedAt =
            performance.now();

        const response = await fetch(
            "/api/pkm",
            {
                method: "GET",
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );

        let result;

        try {
            result =
                await response.json();
        } catch (error) {
            throw new Error(
                "Respons backend PKM tidak valid."
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Gagal mengambil data PKM."
            );
        }

        console.log(
            "[API] SUPABASE",
            action,
            `${(
                (performance.now() - startedAt) /
                1000
            ).toFixed(2)}s`
        );

        console.log(
            "[API] TOTAL",
            action,
            `${(
                (performance.now() - apiStartedAt) /
                1000
            ).toFixed(2)}s`
        );

        // Samakan bentuk response dengan API GAS lama
        return {
            success: true,
            result: result.data
        };
    }

    // ==========================================
    // GAS API
    // ==========================================

    const gasStartedAt =
        performance.now();

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

    const gasDuration =
        performance.now() -
        gasStartedAt;

    console.log(
        "[API] GAS",
        action,
        `${(gasDuration / 1000).toFixed(2)}s`
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

    const apiDuration =
        performance.now() -
        apiStartedAt;

    console.log(
        "[API] TOTAL",
        action,
        `${(apiDuration / 1000).toFixed(2)}s`
    );

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
