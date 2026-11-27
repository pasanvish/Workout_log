package io.github.pasanvish.gymlogger;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Process;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.ai.edge.litertlm.Backend;
import com.google.ai.edge.litertlm.Content;
import com.google.ai.edge.litertlm.Contents;
import com.google.ai.edge.litertlm.ConversationConfig;
import com.google.ai.edge.litertlm.Engine;
import com.google.ai.edge.litertlm.EngineConfig;
import com.google.ai.edge.litertlm.ThinkingConfig;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "LocalAi")
public class LocalAiPlugin extends Plugin {
    private static final long MINIMUM_TOTAL_MEMORY = 5_000_000_000L;
    private static final long MINIMUM_AVAILABLE_MEMORY = 1_700_000_000L;
    private static final long STORAGE_RESERVE = 64 * 1024 * 1024L;
    private static final String MODEL_FILENAME = "qwen3-0.6b-e6bb3e4a.litertlm";

    // One job for the app process, including across Activity recreation.
    private static final Object LOCK = new Object();
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    private static String operation;
    private static String problem;
    private static volatile boolean paused;

    private File model() {
        return new File(getContext().getNoBackupFilesDir(), MODEL_FILENAME);
    }

    private File partial() {
        return new File(getContext().getNoBackupFilesDir(), MODEL_FILENAME + ".part");
    }

    private ActivityManager.MemoryInfo memory() {
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        var info = new ActivityManager.MemoryInfo();
        manager.getMemoryInfo(info);
        return info;
    }

    private String unsupportedReason() {
        if (!Process.is64Bit()) return "Offline AI needs a 64-bit Android device.";
        if (memory().totalMem < MINIMUM_TOTAL_MEMORY) return "Offline AI needs a device with about 6 GB of RAM.";
        return null;
    }

    @PluginMethod
    public void status(PluginCall call) {
        synchronized (LOCK) {
            String unsupported = unsupportedReason();
            boolean ready = model().length() == LocalAiModel.SIZE;
            long bytes = ready ? LocalAiModel.SIZE : partial().length();
            String state = operation;
            if (state == null) {
                if (unsupported != null) state = "unsupported";
                else if (ready) state = "ready";
                else state = bytes > 0 ? "paused" : "available";
            } else if (paused && "downloading".equals(state)) {
                state = "pausing";
            }
            call.resolve(new JSObject().put("state", state).put("bytes", bytes)
                .put("total", LocalAiModel.SIZE).put("message", unsupported == null ? problem : unsupported));
        }
    }

    @PluginMethod
    public void download(PluginCall call) {
        synchronized (LOCK) {
            String unsupported = unsupportedReason();
            if (unsupported != null) { call.reject(unsupported); return; }
            if (operation != null || model().length() == LocalAiModel.SIZE) { call.resolve(); return; }

            File target = model();
            File partial = partial();
            long remaining = Math.max(0, LocalAiModel.SIZE - partial.length());
            if (target.getParentFile().getUsableSpace() < remaining + STORAGE_RESERVE) {
                call.reject("Free up some storage before downloading the model.");
                return;
            }
            paused = false;
            problem = null;
            operation = "downloading";
            WORKER.execute(() -> downloadModel(partial, target));
            call.resolve();
        }
    }

    private static void downloadModel(File partial, File target) {
        try {
            LocalAiModel.download(partial, () -> paused);
            synchronized (LOCK) {
                if (paused) return;
                operation = "verifying";
            }
            if (!LocalAiModel.verify(partial)) {
                if (!partial.delete()) throw new IOException("Could not remove the incomplete model.");
                setProblem("The model failed its integrity check. Start the download again.");
                return;
            }
            if (!partial.renameTo(target)) throw new IOException("Could not save the verified model.");
        } catch (IOException | RuntimeException error) {
            if (!paused) setProblem("Download interrupted. Check your connection or storage, then retry.");
        } finally {
            synchronized (LOCK) { operation = null; }
        }
    }

    private static void setProblem(String message) {
        synchronized (LOCK) { problem = message; }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        synchronized (LOCK) {
            if ("downloading".equals(operation)) paused = true;
            call.resolve();
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        synchronized (LOCK) {
            if (operation != null) { call.reject("Wait for the current task to finish."); return; }
            File target = model();
            File partial = partial();
            if ((target.exists() && !target.delete()) || (partial.exists() && !partial.delete())) {
                call.reject("Could not remove the model from this device.");
                return;
            }
            problem = null;
            call.resolve();
        }
    }

    @PluginMethod
    public void summarize(PluginCall call) {
        String facts = call.getString("facts", "").trim();
        if (facts.isEmpty() || facts.length() > 1600) { call.reject("Choose a saved week to summarize."); return; }

        synchronized (LOCK) {
            String unsupported = unsupportedReason();
            if (unsupported != null) { call.reject(unsupported); return; }
            if (operation != null) { call.reject("Wait for the current task to finish."); return; }
            File model = model();
            if (model.length() != LocalAiModel.SIZE) { call.reject("Download the offline model first."); return; }
            ActivityManager.MemoryInfo memory = memory();
            if (memory.lowMemory || memory.availMem < MINIMUM_AVAILABLE_MEMORY) {
                call.reject("Free up device memory by closing other apps, then try again.");
                return;
            }
            String cache = getContext().getCacheDir().getAbsolutePath();
            operation = "generating";
            problem = null;
            WORKER.execute(() -> generate(facts, model, cache, call));
        }
    }

    private static void generate(String facts, File model, String cache, PluginCall call) {
        JSObject result = null;
        try {
            var config = new EngineConfig(model.getAbsolutePath(), new Backend.CPU(4, null),
                null, null, 768, null, cache);
            try (var engine = new Engine(config)) {
                engine.initialize();
                String instructions = "Summarize this workout log in two short sentences. Use only the facts supplied. "
                    + "Include the current week's workout and set counts. Compare with last week only if that is useful. "
                    + "Use plain English. Do not guess numbers or give training advice.";
                try (var conversation = engine.createConversation(new ConversationConfig(Contents.Companion.of(instructions)))) {
                    var reply = conversation.sendMessage(facts, Collections.singletonMap("enable_thinking", false),
                        null, null, null, 100, new ThinkingConfig(false), null);
                    StringBuilder summary = new StringBuilder();
                    for (Content content : reply.getContents().getContents()) {
                        if (content instanceof Content.Text) summary.append(((Content.Text) content).getText());
                    }
                    String text = summary.toString().trim();
                    if (text.isEmpty()) throw new IllegalStateException("Empty model response.");
                    result = new JSObject().put("summary", text);
                }
            }
        } catch (Exception | LinkageError error) {
            Log.w("GymLoggerLocalAi", "Offline model failed: " + error.getClass().getSimpleName());
        } finally {
            synchronized (LOCK) { operation = null; }
        }
        if (result == null) call.reject("The offline model could not finish a summary. Try again after closing other apps.");
        else call.resolve(result);
    }
}
