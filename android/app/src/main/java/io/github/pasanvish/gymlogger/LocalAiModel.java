package io.github.pasanvish.gymlogger;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.function.BooleanSupplier;

enum LocalAiModel {
    LITE("lite", "SmolLM2 135M", "smollm2-135m-f7e7688.litertlm", 142_819_328L,
        "ccdc5c85735743f081b7d44ca309cab569f76c0f2f0e8e163449a63721969c37",
        "SmolLM2-135M-Instruct/resolve/f7e76881373410af03873a1d92e939495ba98f7b/SmolLM2_135M_Instruct.litertlm",
        3_000_000_000L, 1_050_000_000L, 256, 2),
    QWEN("qwen", "Qwen3 0.6B", "qwen3-0.6b-e6bb3e4a.litertlm", 344_671_744L,
        "03e7da1eb1108b50dffaa9bb52cc7bcbad2eb0c66ca990267f480c1e545d2856",
        "Qwen3-0.6B/resolve/e6bb3e4a1eb3f663153f0c1c12b735d64be657a7/Qwen3-0.6B_dynamic_wi4b32_afp32.litertlm",
        5_000_000_000L, 1_700_000_000L, 768, 4);

    final String id;
    final String name;
    final String filename;
    final long size;
    private final String sha256;
    private final String url;
    final long minimumTotalMemory;
    final long minimumAvailableMemory;
    final int contextTokens;
    final int threads;

    LocalAiModel(String id, String name, String filename, long size, String sha256, String path,
                 long minimumTotalMemory, long minimumAvailableMemory, int contextTokens, int threads) {
        this.id = id;
        this.name = name;
        this.filename = filename;
        this.size = size;
        this.sha256 = sha256;
        this.url = "https://huggingface.co/litert-community/" + path;
        this.minimumTotalMemory = minimumTotalMemory;
        this.minimumAvailableMemory = minimumAvailableMemory;
        this.contextTokens = contextTokens;
        this.threads = threads;
    }

    static LocalAiModel fromId(String id) {
        for (LocalAiModel model : values()) {
            if (model.id.equals(id)) return model;
        }
        return null;
    }

    void download(File partial, BooleanSupplier paused) throws IOException {
        long offset = partial.length();
        if (offset >= size) return;

        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        try {
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(15_000);
            connection.setRequestProperty("Accept-Encoding", "identity");
            if (offset > 0) connection.setRequestProperty("Range", "bytes=" + offset + "-");

            int code = connection.getResponseCode();
            if (code == HttpURLConnection.HTTP_OK) {
                offset = 0;
            } else {
                String range = "bytes " + offset + "-" + (size - 1) + "/" + size;
                if (code != HttpURLConnection.HTTP_PARTIAL || !range.equals(connection.getHeaderField("Content-Range"))) {
                    throw new IOException("The server did not return the requested model bytes.");
                }
            }

            try (var input = new BufferedInputStream(connection.getInputStream());
                 var output = new RandomAccessFile(partial, "rw")) {
                output.setLength(offset);
                output.seek(offset);
                byte[] buffer = new byte[128 * 1024];
                while (!paused.getAsBoolean()) {
                    int read = input.read(buffer);
                    if (read < 0) break;
                    offset += read;
                    if (offset > size) throw new IOException("The model download exceeded its expected size.");
                    output.write(buffer, 0, read);
                }
                if (!paused.getAsBoolean() && offset != size) throw new IOException("The model download was incomplete.");
            }
        } finally {
            connection.disconnect();
        }
    }

    boolean verify(File downloaded) throws IOException {
        if (downloaded.length() != size) return false;
        try (var input = new BufferedInputStream(new FileInputStream(downloaded))) {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[128 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) sha.update(buffer, 0, read);
            StringBuilder digest = new StringBuilder(64);
            for (byte value : sha.digest()) {
                digest.append(Character.forDigit((value & 0xff) >>> 4, 16));
                digest.append(Character.forDigit(value & 0xf, 16));
            }
            return sha256.contentEquals(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable", error);
        }
    }
}
