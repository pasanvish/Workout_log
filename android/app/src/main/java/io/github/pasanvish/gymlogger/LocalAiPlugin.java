package io.github.pasanvish.gymlogger;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Process;
import android.util.Log;
import com.getcapacitor.JSArray;
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
import com.google.ai.edge.litertlm.SamplerConfig;
import com.google.ai.edge.litertlm.ThinkingConfig;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.EnumMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "LocalAi")
public class LocalAiPlugin extends Plugin {
    private static final long STORAGE_RESERVE = 64 * 1024 * 1024L;

    // One job for the app process, including across Activity recreation.
    private static final Object LOCK = new Object();
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    private static String operation;
    private static LocalAiModel activeModel;
    private static final EnumMap<LocalAiModel, String> problems = new EnumMap<>(LocalAiModel.class);
    private static volatile boolean paused;

    private File modelFile(LocalAiModel model) {
        return new File(getContext().getNoBackupFilesDir(), model.filename);
    }

    private File partialFile(LocalAiModel model) {
        return new File(getContext().getNoBackupFilesDir(), model.filename + ".part");
    }

    private ActivityManager.MemoryInfo memory() {
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        var info = new ActivityManager.MemoryInfo();
        manager.getMemoryInfo(info);
        return info;
    }

    private String unsupportedReason(LocalAiModel model, ActivityManager.MemoryInfo memory) {
        if (!Process.is64Bit()) return "Offline AI needs a 64-bit Android device.";
        if (memory.totalMem >= model.minimumTotalMemory) return null;
        return "Downloaded AI models need about 4 GB of RAM.";
    }

    private static boolean compactMode(LocalAiModel model, ActivityManager.MemoryInfo memory) {
        return model == LocalAiModel.QWEN && memory.totalMem < 5_000_000_000L;
    }

    @PluginMethod
    public void status(PluginCall call) {
        synchronized (LOCK) {
            var models = new JSArray();
            var memory = memory();
            for (LocalAiModel model : LocalAiModel.values()) {
                String unsupported = unsupportedReason(model, memory);
                boolean ready = modelFile(model).length() == model.size;
                long bytes = ready ? model.size : partialFile(model).length();
                String state;
                if (model == activeModel) {
                    state = paused && "downloading".equals(operation) ? "pausing" : operation;
                } else if (unsupported != null) {
                    state = "unsupported";
                } else if (ready) {
                    state = "ready";
                } else {
                    state = bytes > 0 ? "paused" : "available";
                }
                models.put(new JSObject().put("id", model.id).put("name", model.name).put("state", state)
                    .put("bytes", bytes).put("total", model.size).put("compact", compactMode(model, memory))
                    .put("message", unsupported == null ? problems.get(model) : unsupported));
            }
            call.resolve(new JSObject().put("models", models).put("busy", activeModel != null));
        }
    }

    private LocalAiModel requestedModel(PluginCall call) {
        LocalAiModel model = LocalAiModel.fromId(call.getString("model"));
        if (model == null) call.reject("Choose a model first.");
        return model;
    }

    @PluginMethod
    public void download(PluginCall call) {
        LocalAiModel model = requestedModel(call);
        if (model == null) return;
        synchronized (LOCK) {
            String unsupported = unsupportedReason(model, memory());
            if (unsupported != null) { call.reject(unsupported); return; }
            if (activeModel != null) { call.reject("Wait for the current task to finish."); return; }
            File target = modelFile(model);
            if (target.length() == model.size) { call.resolve(); return; }

            File partial = partialFile(model);
            long remaining = Math.max(0, model.size - partial.length());
            if (target.getParentFile().getUsableSpace() < remaining + STORAGE_RESERVE) {
                call.reject("Free up some storage before downloading the model.");
                return;
            }
            paused = false;
            problems.remove(model);
            activeModel = model;
            operation = "downloading";
            WORKER.execute(() -> downloadModel(model, partial, target));
            call.resolve();
        }
    }

    private static void downloadModel(LocalAiModel model, File partial, File target) {
        try {
            model.download(partial, () -> paused);
            synchronized (LOCK) {
                if (paused) return;
                operation = "verifying";
            }
            if (!model.verify(partial)) {
                if (!partial.delete()) throw new IOException("Could not remove the incomplete model.");
                setProblem(model, "The model failed its integrity check. Start the download again.");
                return;
            }
            if (!partial.renameTo(target)) throw new IOException("Could not save the verified model.");
        } catch (IOException | RuntimeException error) {
            if (!paused) setProblem(model, "Download interrupted. Check your connection or storage, then retry.");
        } finally {
            finishOperation();
        }
    }

    private static void finishOperation() {
        synchronized (LOCK) {
            activeModel = null;
            operation = null;
            paused = false;
        }
    }

    private static void setProblem(LocalAiModel model, String message) {
        synchronized (LOCK) { problems.put(model, message); }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        LocalAiModel model = requestedModel(call);
        if (model == null) return;
        synchronized (LOCK) {
            if (model == activeModel && "downloading".equals(operation)) paused = true;
            call.resolve();
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        LocalAiModel model = requestedModel(call);
        if (model == null) return;
        synchronized (LOCK) {
            if (activeModel != null) { call.reject("Wait for the current task to finish."); return; }
            File target = modelFile(model);
            File partial = partialFile(model);
            if ((target.exists() && !target.delete()) || (partial.exists() && !partial.delete())) {
                call.reject("Could not remove the model from this device.");
                return;
            }
            problems.remove(model);
            call.resolve();
        }
    }

    @PluginMethod
    public void summarize(PluginCall call) {
        LocalAiModel model = requestedModel(call);
        if (model == null) return;
        String facts = call.getString("facts", "").trim();
        if (facts.isEmpty() || facts.length() > 600) { call.reject("Choose a saved week to summarize."); return; }

        synchronized (LOCK) {
            var memory = memory();
            String unsupported = unsupportedReason(model, memory);
            if (unsupported != null) { call.reject(unsupported); return; }
            if (activeModel != null) { call.reject("Wait for the current task to finish."); return; }
            File file = modelFile(model);
            if (file.length() != model.size) { call.reject("Download the offline model first."); return; }
            if (memory.lowMemory || memory.availMem < model.minimumAvailableMemory) {
                call.reject("The phone is low on available memory. Close some apps and try again.");
                return;
            }
            String cache = getContext().getCacheDir().getAbsolutePath();
            activeModel = model;
            operation = "generating";
            problems.remove(model);
            boolean compact = compactMode(model, memory);
            WORKER.execute(() -> generate(model, compact, facts, file, cache, call));
        }
    }

    private static void generate(LocalAiModel model, boolean compact, String facts, File file, String cache, PluginCall call) {
        JSObject result = null;
        try {
            boolean lite = model == LocalAiModel.LITE;
            var config = new EngineConfig(file.getAbsolutePath(), new Backend.CPU(compact ? 2 : model.threads, null),
                null, null, compact ? 256 : model.contextTokens, null, lite || compact ? ":nocache" : cache);
            try (var engine = new Engine(config)) {
                engine.initialize();
                String instructions = lite
                    ? "Write one short workout recap in the second person. Use the exact numbers supplied. Return one sentence starting with You."
                    : "Write exactly two short sentences with workout and set counts. "
                        + "Start the first with This week: and the second with Last week:. Use the supplied counts and stop after the second sentence.";
                var contents = Contents.Companion.of(instructions);
                var conversationConfig = lite || compact
                    ? new ConversationConfig(contents, Collections.emptyList(), Collections.emptyList(), new SamplerConfig(1, 1.0, 0.0, 0))
                    : new ConversationConfig(contents);
                try (var conversation = engine.createConversation(conversationConfig)) {
                    var reply = conversation.sendMessage(facts, lite ? Collections.emptyMap() : Collections.singletonMap("enable_thinking", false),
                        null, null, null, lite ? 45 : compact ? 48 : 100, lite ? null : new ThinkingConfig(false), null);
                    StringBuilder summary = new StringBuilder();
                    for (Content content : reply.getContents().getContents()) {
                        if (content instanceof Content.Text) summary.append(((Content.Text) content).getText());
                    }
                    String text = summary.toString().trim();
                    if (text.isEmpty() && !lite) throw new IllegalStateException("Empty model response.");
                    result = new JSObject().put("summary", text);
                }
            }
        } catch (Exception | LinkageError error) {
            Log.w("GymLoggerLocalAi", "Offline model failed: " + error.getClass().getSimpleName());
        } finally {
            finishOperation();
        }
        if (result == null) call.reject("The offline model could not finish a summary. Try again after closing other apps.");
        else call.resolve(result);
    }
}
