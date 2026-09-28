export default async function handler(
    request,
    response
) {
    const apiStartedAt =
        performance.now();
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

    try {
        let requestBody =
            request.body || {};

        const traceId =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

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
            JSON.stringify(requestBody).length,
            "chars"
        );

        if (
            typeof requestBody === "string"
        ) {
            requestBody =
                JSON.parse(requestBody);
        }

        const gasRequestStartedAt =
            performance.now();

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

                    redirect: "follow"
                }
            );

        const gasResponseReceivedAt =
            performance.now();

        console.log(
            "[VERCEL] GAS RESPONSE",
            traceId,
            requestBody.action,
            `${(
                (gasResponseReceivedAt -
                    gasRequestStartedAt) /
                1000
            ).toFixed(2)}s`
        );

        const textStartedAt =
            performance.now();

        const responseText =
            await appsScriptResponse.text();

        const textFinishedAt =
            performance.now();

        console.log(
            "[VERCEL] GAS TEXT",
            traceId,
            requestBody.action,
            `${(
                (textFinishedAt -
                    textStartedAt) /
                1000
            ).toFixed(2)}s`,
            `${responseText.length} chars`,
            `${(
                responseText.length /
                1024 /
                1024
            ).toFixed(3)} MB`,
            responseText
        );

        const jsonStartedAt =
            performance.now();

        let result;

        try {
            result =
                JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                "Respons Apps Script bukan JSON."
            );
        }

        const jsonFinishedAt =
            performance.now();

        console.log(
            "[VERCEL] JSON PARSE",
            traceId,
            requestBody.action,
            `${(
                (jsonFinishedAt -
                    jsonStartedAt) /
                1000
            ).toFixed(2)}s`
        );

        if (!result.success) {
            return response
                .status(400)
                .json({
                    success: false,

                    message:
                        result.message ||
                        "Apps Script gagal memproses data."
                });
        }

        const apiDuration =
            performance.now() -
            apiStartedAt;

        console.log(
            "[VERCEL] API TOTAL",
            traceId,
            requestBody.action,
            `${(
                apiDuration / 1000
            ).toFixed(2)}s`
        );

        const browserResponseStartedAt =
            performance.now();

        console.log(
            "[VERCEL] BEFORE BROWSER RESPONSE",
            traceId,
            requestBody.action,
            `${(
                (browserResponseStartedAt -
                    apiStartedAt) /
                1000
            ).toFixed(2)}s`
        );

        return response
            .status(200)
            .json(result.result);


    } catch (error) {
        return response
            .status(500)
            .json({
                success: false,

                message:
                    error && error.message
                        ? error.message
                        : "Gagal menghubungi Apps Script."
            });
    }
}