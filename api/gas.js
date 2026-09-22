export const config = {
    maxDuration: 60
};


export default async function handler(
    request,
    response
) {
    const startedAt =
        Date.now();

    response.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
    );

    if (request.method !== "POST") {
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

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            function () {
                controller.abort();
            },
            55000
        );

    try {
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

        const appsScriptResponse =
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

        const responseText =
            await appsScriptResponse.text();

        let result;

        try {
            result =
                JSON.parse(
                    responseText
                );
        } catch (error) {
            console.error(
                "Respons GAS bukan JSON:",
                responseText.slice(
                    0,
                    500
                )
            );

            throw new Error(
                "Respons Apps Script bukan JSON."
            );
        }

        const duration =
            Date.now() - startedAt;

        response.setHeader(
            "Server-Timing",
            `gas;dur=${duration}`
        );

        if (!result.success) {
            return response
                .status(400)
                .json({
                    success: false,

                    message:
                        result.message ||
                        "Apps Script gagal memproses data.",

                    durationMs:
                        duration
                });
        }

        return response
            .status(200)
            .json({
                ...result.result,

                /*
                | Untuk melihat durasi backend
                | pada Network Response.
                */

                _serverDurationMs:
                    duration
            });

    } catch (error) {
        const duration =
            Date.now() - startedAt;

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
                        "Google Apps Script tidak merespons dalam 55 detik.",
                    durationMs:
                        duration
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
                        : "Gagal menghubungi Apps Script.",

                durationMs:
                    duration
            });
    } finally {
        clearTimeout(
            timeoutId
        );
    }
}