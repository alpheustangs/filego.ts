import type { Chunk } from "@filego/shared";

type _SplitOptions = {
    /**
     * file to split, which accepts:
     * - File / Blob
     * - Uint8Array data
     * - Base64 data prefixed with "data:"
     */
    file: File | Blob | Uint8Array | string;
    /**
     * size of each chunk in byte
     */
    chunkSize: number;
};

type SplitFunctionOptions = _SplitOptions;

type SplitResult = {
    /**
     * chunks
     */
    chunks: Chunk[];
    /**
     * size of the original file
     */
    fileSize: number;
    /**
     * how many chunks in total
     */
    totalChunks: number;
};

type SplitOptions = _SplitOptions & {
    /**
     * custom split function
     */
    splitFunction?: (
        options: SplitFunctionOptions,
    ) => SplitResult | Promise<SplitResult>;
};

const ermsg: string =
    "file is not a File, Blob, file URI, Uint8Array or Base64 data";

const split = async (options: SplitOptions): Promise<SplitResult> => {
    const { file, chunkSize, splitFunction }: SplitOptions = options;

    if (!file || (typeof file === "string" && file.trim() === "")) {
        throw new TypeError(ermsg);
    }

    if (typeof chunkSize !== "number" || chunkSize <= 0) {
        throw new TypeError("chunkSize is not a positive number");
    }

    if (splitFunction && typeof splitFunction !== "function") {
        throw new TypeError("splitFunction is not a function");
    }

    /* custom split function */

    if (splitFunction) return await splitFunction({ file, chunkSize });

    let blob: Blob;

    // string
    if (typeof file === "string") {
        // base64
        if (file.startsWith("data:")) {
            const byteCharacters: string = atob(
                file.slice(file.indexOf(",") + 1),
            );
            const byteNumbers: number[] = new Array(byteCharacters.length);

            for (let i: number = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            blob = new Blob([new Uint8Array(byteNumbers)]);
        } else {
            throw new TypeError(ermsg);
        }
    }
    // uint8array
    else if (file instanceof Uint8Array) {
        blob = new Blob([file]);
    }
    // file / blob
    else if (file instanceof Blob) {
        blob = file;
    }
    // unknown
    else {
        throw new TypeError(ermsg);
    }

    const total: number = Math.ceil(blob.size / chunkSize);
    const chunks: Chunk[] = [];

    for (let i: number = 0; i < total; i++) {
        const offset: number = i * chunkSize;
        const limit: number = Math.min(offset + chunkSize, blob.size);
        chunks.push({ index: i, blob: blob.slice(offset, limit) });
    }

    return {
        chunks,
        fileSize: blob.size,
        totalChunks: total,
    };
};

export type { SplitOptions, SplitFunctionOptions, SplitResult };
export { split };