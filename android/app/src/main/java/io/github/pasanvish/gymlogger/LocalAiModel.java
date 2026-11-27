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

final class LocalAiModel {
    static final long SIZE = 344_671_744L;
    private static final String SHA256 = "03e7da1eb1108b50dffaa9bb52cc7bcbad2eb0c66ca990267f480c1e545d2856";
    private static final String URL =
        "https://huggingface.co/litert-community/Qwen3-0.6B/resolve/e6bb3e4a1eb3f663153f0c1c12b735d64be657a7/"
        + "Qwen3-0.6B_dynamic_wi4b32_afp32.litertlm";

    private LocalAiModel() {}

    static void download(File partial, BooleanSupplier paused) throws IOException {
        long offset = partial.length();
        if (offset >= SIZE) return;

        HttpURLConnection connection = (HttpURLConnection) new URL(URL).openConnection();
        try {
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(15_000);
            connection.setRequestProperty("Accept-Encoding", "identity");
            if (offset > 0) connection.setRequestProperty("Range", "bytes=" + offset + "-");

            int code = connection.getResponseCode();
            if (code == HttpURLConnection.HTTP_OK) {
                offset = 0;
            } else {
                String range = "bytes " + offset + "-" + (SIZE - 1) + "/" + SIZE;
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
                    if (offset > SIZE) throw new IOException("The model download exceeded its expected size.");
                    output.write(buffer, 0, read);
                }
                if (!paused.getAsBoolean() && offset != SIZE) throw new IOException("The model download was incomplete.");
            }
        } finally {
            connection.disconnect();
        }
    }

    static boolean verify(File downloaded) throws IOException {
        if (downloaded.length() != SIZE) return false;
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
            return SHA256.contentEquals(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable", error);
        }
    }
}
