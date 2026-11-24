package io.github.pasanvish.gymlogger;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("filename");
        String type = call.getString("mimeType");
        String content = call.getString("content");
        if (name == null || name.isEmpty() || content == null
                || !("application/json".equals(type) || "text/html".equals(type))) {
            call.reject("Invalid export file.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType(type)
            .putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(call, intent, "onDestinationPicked");
        } catch (ActivityNotFoundException error) {
            call.reject("The Android file picker is unavailable.", error);
        }
    }

    @ActivityCallback
    private void onDestinationPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Intent data = result.getData();
        Uri destination = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) {
            call.resolve(new JSObject().put("saved", false));
            return;
        }

        new Thread(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(destination, "wt")) {
                if (stream == null) throw new IOException("File provider did not open the destination.");
                stream.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
            } catch (IOException | SecurityException error) {
                call.reject("Could not write the export at the selected location.", error);
                return;
            }
            call.resolve(new JSObject().put("saved", true));
        }, "gym-logger-export").start();
    }
}
