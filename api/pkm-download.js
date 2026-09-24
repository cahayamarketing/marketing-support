export default async function handler(
    req,
    res
) {
    if (
        req.method !== "GET"
    ) {
        res.setHeader(
            "Allow",
            "GET"
        );

        return res
            .status(405)
            .json({
                success:
                    false,

                message:
                    "Method tidak diizinkan."
            });
    }

    const downloadToken =
        String(
            req.query.token || ""
        ).trim();

    if (!downloadToken) {
        return res
            .status(400)
            .send(
                "Token download tidak tersedia."
            );
    }

    const gasUrl =
        process.env
            .GAS_WEB_APP_URL;

    if (!gasUrl) {
        return res
            .status(500)
            .send(
                "GAS_WEB_APP_URL belum dikonfigurasi."
            );
    }

    try {
        const gasResponse =
            await fetch(
                gasUrl,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            action:
                                "getPkmPdfDownload",

                            token:
                                "",

                            payload: {
                                downloadToken:
                                    downloadToken
                            }
                        })
                }
            );

        const gasResult =
            await gasResponse.json();

        if (
            !gasResult ||
            gasResult.success !==
            true
        ) {
            throw new Error(
                gasResult &&
                gasResult.message
                    ? gasResult.message
                    : "PDF tidak dapat diambil."
            );
        }

        const data =
            gasResult.result;

        if (
            !data ||
            !data.pdfBase64
        ) {
            throw new Error(
                "Data PDF kosong."
            );
        }

        const pdfBuffer =
            Buffer.from(
                data.pdfBase64,
                "base64"
            );

        const fileName =
            String(
                data.fileName ||
                "PKM.pdf"
            )
                .replace(
                    /["\r\n]/g,
                    ""
                );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.setHeader(
            "Content-Length",
            pdfBuffer.length
        );

        res.setHeader(
            "Cache-Control",
            "private, no-store"
        );

        return res
            .status(200)
            .send(
                pdfBuffer
            );

    } catch (error) {
        console.error(
            "PKM DOWNLOAD ERROR:",
            error
        );

        return res
            .status(400)
            .send(
                error &&
                error.message
                    ? error.message
                    : "PDF gagal diunduh."
            );
    }
}