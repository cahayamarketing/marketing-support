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

        let appsScriptResponse = null;
        let responseText = "";
        let lastError = null;

        const MAX_GAS_RETRY = 3;

        for (
            let attempt = 1;
            attempt <= MAX_GAS_RETRY;
            attempt++
        ) {

            const attemptStartedAt =
                performance.now();

            try {

                console.log(
                    "[VERCEL] GAS ATTEMPT",
                    traceId,
                    requestBody.action,
                    attempt
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

                            redirect: "follow"
                        }
                    );

                const attemptFinishedAt =
                    performance.now();

                console.log(
                    "[VERCEL] GAS ATTEMPT RESULT",
                    traceId,
                    requestBody.action,
                    attempt,
                    "STATUS=",
                    appsScriptResponse.status,
                    "OK=",
                    appsScriptResponse.ok,
                    `${(
                        (attemptFinishedAt -
                            attemptStartedAt) /
                        1000
                    ).toFixed(2)}s`
                );

                responseText =
                    await appsScriptResponse.text();

                console.log(
                    "[VERCEL] GAS ATTEMPT TEXT",
                    traceId,
                    requestBody.action,
                    attempt,
                    `${responseText.length} chars`
                );

                let parsedTest = null;

                try {
                    parsedTest =
                        JSON.parse(responseText);
                } catch (e) {
                    parsedTest = null;
                }

                if (
                    appsScriptResponse.ok &&
                    parsedTest &&
                    parsedTest.success === true
                ) {
                    console.log(
                        "[VERCEL] GAS ATTEMPT SUCCESS",
                        traceId,
                        requestBody.action,
                        attempt
                    );

                    break;
                }

                console.warn(
                    "[VERCEL] GAS ATTEMPT INVALID",
                    traceId,
                    requestBody.action,
                    attempt,
                    responseText.substring(
                        0,
                        200
                    )
                );

            } catch (error) {

                lastError = error;

                console.error(
                    "[VERCEL] GAS ATTEMPT ERROR",
                    traceId,
                    requestBody.action,
                    attempt,
                    error &&
                    error.message
                        ? error.message
                        : error
                );
            }
        }

        if (!responseText) {

            throw (
                lastError ||
                new Error(
                    "Apps Script tidak memberikan response."
                )
            );
        }

        const gasResponseReceivedAt =
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
                (gasResponseReceivedAt -
                    gasRequestStartedAt) /
                1000
            ).toFixed(2)}s`
        );

        console.log(
            "[VERCEL] GAS HEADERS",
            traceId,
            requestBody.action,
            "content-type=",
            appsScriptResponse.headers.get(
                "content-type"
            ),
            "content-length=",
            appsScriptResponse.headers.get(
                "content-length"
            ),
            "location=",
            appsScriptResponse.headers.get(
                "location"
            )
        );

        console.log(
            "[VERCEL] GAS TEXT FINAL",
            traceId,
            requestBody.action,
            `${responseText.length} chars`,
            `${(
                responseText.length /
                1024 /
                1024
            ).toFixed(3)} MB`
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