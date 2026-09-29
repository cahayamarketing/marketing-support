export default async function handler(
    request,
    response
) {
    const apiStartedAt =
        performance.now();

    if (
        request.method !== "POST"
    ) {
        return response.status(405).json({
            success: false,
            message:
                "Gunakan method POST."
        });
    }

    const appsScriptUrl =
        process.env.GAS_WEB_APP_URL;

    if (!appsScriptUrl) {
        return response.status(500).json({
            success: false,
            message:
                "GAS_WEB_APP_URL belum diatur di Vercel."
        });
    }

    const traceId =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    try {

        /*
        |--------------------------------------------------------------------------
        | REQUEST BODY
        |--------------------------------------------------------------------------
        */

        let requestBody =
            request.body || {};

        if (
            typeof requestBody ===
            "string"
        ) {
            requestBody =
                JSON.parse(
                    requestBody
                );
        }

        requestBody._traceId =
            traceId;

        console.log(
            "[VERCEL] START",
            traceId,
            requestBody.action
        );

        console.log(
            "[VERCEL] REQUEST BODY READY",
            traceId,
            requestBody.action,
            JSON.stringify(
                requestBody
            ).length,
            "chars"
        );


        /*
        |--------------------------------------------------------------------------
        | APPS SCRIPT REQUEST
        |--------------------------------------------------------------------------
        |
        | Jangan retry 3x secara membabi buta.
        |
        | Endpoint Apps Script yang baru sudah terbukti
        | normal ketika diakses langsung.
        |
        */

        const gasStartedAt =
            performance.now();

        const controller =
            new AbortController();

        /*
        | Batas maksimum satu request ke Apps Script.
        |
        | Normal PKM sekarang < 3 detik.
        | Kita beri ruang sampai 15 detik.
        */

        const timeoutId =
            setTimeout(
                function () {
                    controller.abort();
                },
                15000
            );

        let appsScriptResponse;

        try {

            console.log(
                "[VERCEL] GAS REQUEST",
                traceId,
                requestBody.action
            );

            appsScriptResponse =
                await fetch(
                    appsScriptUrl,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            ),

                        redirect: "follow",

                        signal:
                            controller.signal
                    }
                );

        } finally {

            clearTimeout(
                timeoutId
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GAS RESPONSE TIMING
        |--------------------------------------------------------------------------
        */

        const gasResponseAt =
            performance.now();

        console.log(
            "[VERCEL] GAS RESPONSE",
            traceId,
            requestBody.action,
            "STATUS=",
            appsScriptResponse.status,
            "OK=",
            appsScriptResponse.ok,
            `${(
                (gasResponseAt -
                    gasStartedAt) /
                1000
            ).toFixed(2)}s`
        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE TEXT
        |--------------------------------------------------------------------------
        */

        const responseText =
            await appsScriptResponse.text();

        console.log(
            "[VERCEL] GAS TEXT",
            traceId,
            requestBody.action,
            `${responseText.length} chars`
        );


        /*
        |--------------------------------------------------------------------------
        | VALIDASI HTTP
        |--------------------------------------------------------------------------
        */

        if (
            !appsScriptResponse.ok
        ) {

            console.error(
                "[VERCEL] GAS HTTP ERROR",
                traceId,
                requestBody.action,
                "STATUS=",
                appsScriptResponse.status,
                responseText.substring(
                    0,
                    500
                )
            );

            return response
                .status(502)
                .json({
                    success: false,
                    message:
                        `Apps Script mengembalikan HTTP ${appsScriptResponse.status}.`
                });
        }


        /*
        |--------------------------------------------------------------------------
        | PARSE JSON
        |--------------------------------------------------------------------------
        */

        let result;

        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            console.error(
                "[VERCEL] GAS INVALID JSON",
                traceId,
                requestBody.action,
                responseText.substring(
                    0,
                    500
                )
            );

            return response
                .status(502)
                .json({
                    success: false,
                    message:
                        "Respons Apps Script bukan JSON."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDASI APPS SCRIPT
        |--------------------------------------------------------------------------
        */

        if (
            !result ||
            result.success !== true
        ) {

            console.error(
                "[VERCEL] GAS APPLICATION ERROR",
                traceId,
                requestBody.action,
                result
            );

            return response
                .status(400)
                .json({
                    success: false,

                    message:
                        result?.message ||
                        "Apps Script gagal memproses data."
                });
        }


        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        */

        const apiDuration =
            performance.now() -
            apiStartedAt;

        console.log(
            "[VERCEL] API TOTAL",
            traceId,
            requestBody.action,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE KE BROWSER
        |--------------------------------------------------------------------------
        */

        console.log(
            "[VERCEL] BEFORE BROWSER RESPONSE",
            traceId,
            requestBody.action,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );

        return response
            .status(200)
            .json(
                result.result
            );


    } catch (error) {

        const apiDuration =
            performance.now() -
            apiStartedAt;

        console.error(
            "[VERCEL] API ERROR",
            traceId,
            request.body?.action,
            error &&
            error.message
                ? error.message
                : error
        );

        console.error(
            "[VERCEL] API TOTAL ERROR",
            traceId,
            `${(
                apiDuration /
                1000
            ).toFixed(2)}s`
        );


        if (
            error &&
            error.name ===
            "AbortError"
        ) {

            return response
                .status(504)
                .json({
                    success: false,
                    message:
                        "Apps Script terlalu lama merespons."
                });
        }


        return response
            .status(500)
            .json({
                success: false,

                message:
                    error &&
                    error.message
                        ? error.message
                        : "Gagal menghubungi Apps Script."
            });
    }
}